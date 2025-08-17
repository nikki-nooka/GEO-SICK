
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { AnalysisResult, LocationAnalysisResult, Facility, PrescriptionAnalysisResult, HealthForecast, MentalHealthResult, SymptomAnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const locationAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING, description: "The short name of the identified location (e.g., 'Central Park, New York, USA')." },
        hazards: {
            type: Type.ARRAY,
            description: "A list of identified potential health hazards based on the location's geography and climate.",
            items: {
                type: Type.OBJECT,
                properties: {
                    hazard: { type: Type.STRING, description: "The specific hazard identified, e.g., 'Stagnant Water Pool'." },
                    description: { type: Type.STRING, description: "A brief description of why this hazard is relevant to the location." }
                },
                required: ["hazard", "description"]
            }
        },
        diseases: {
            type: Type.ARRAY,
            description: "A list of potential diseases associated with the identified hazards.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the potential disease, e.g., 'Malaria'." },
                    cause: { type: Type.STRING, description: "How the identified hazards can cause this disease." },
                    precautions: {
                        type: Type.ARRAY,
                        description: "A list of practical preventive measures against this disease.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["name", "cause", "precautions"]
            }
        },
        summary: {
            type: Type.STRING,
            description: "A concise overall summary of the environmental health assessment, written in an urgent but informative tone."
        }
    },
    required: ["locationName", "hazards", "diseases", "summary"]
};

export const analyzeLocationByCoordinates = async (lat: number, lng: number, knownLocationName?: string): Promise<{ analysis: LocationAnalysisResult, imageUrl: string | null }> => {
    let contents: string;
    if (knownLocationName) {
        contents = `Act as an environmental scientist providing an objective analysis of the location at latitude ${lat} and longitude ${lng}.
            The location is known as "${knownLocationName}". Use this exact name for the 'locationName' field in your response.
            Your goal is to identify potential environmental health risks based on geography and climate, not to provide medical advice.
            1.  Based on its environment, list potential health hazards (e.g., 'High Pollen Count', 'Stagnant Water Sources').
            2.  For each hazard, list associated, potential diseases or health conditions.
            3.  For each disease, list general, non-prescriptive public health precautions.
            4.  Write a brief, neutral summary of the location's environmental profile.
            Your response must be a single JSON object conforming to the provided schema.`;
    } else {
        contents = `Act as an environmental scientist providing an objective analysis of the location at latitude ${lat} and longitude ${lng}.
            Your goal is to identify potential environmental health risks based on geography and climate, not to provide medical advice.
            1.  Identify the common name for the location (e.g., 'Central Park, New York, USA').
            2.  Based on its environment, list potential health hazards (e.g., 'High Pollen Count', 'Stagnant Water Sources').
            3.  For each hazard, list associated, potential diseases or health conditions.
            4.  For each disease, list general, non-prescriptive public health precautions.
            5.  Write a brief, neutral summary of the location's environmental profile.
            Your response must be a single JSON object conforming to the provided schema.`;
    }

    const [analysisResult, imageResult] = await Promise.allSettled([
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: locationAnalysisSchema,
            }
        }),
        ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `Generate a realistic but generic satellite or high-angle neighborhood photograph for a location at latitude ${lat}, longitude ${lng}. Show a typical environmental setting. Avoid showing specific landmarks or text.`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        })
    ]);

    // Analysis is critical, so if it fails, we throw.
    if (analysisResult.status === 'rejected') {
        console.error("Location analysis failed:", analysisResult.reason);
        throw new Error("The model failed to provide location analysis.");
    }

    let analysis: LocationAnalysisResult;
    try {
        const jsonText = analysisResult.value.text.trim();
        analysis = JSON.parse(jsonText) as LocationAnalysisResult;
    } catch (e) {
        console.error("Failed to parse JSON from analysis:", analysisResult.value.text);
        throw new Error("The model returned an invalid data format for the location analysis.");
    }
    
    let imageUrl: string | null = null;
    if (imageResult.status === 'fulfilled') {
        const imageResponse = imageResult.value;
        if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
            const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
            imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
             console.warn("Image generation succeeded but returned no images.");
        }
    } else {
        console.warn("Image generation failed:", imageResult.reason);
        // Image generation failed, but we can proceed without it.
    }

    return { analysis, imageUrl };
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        hazards: {
            type: Type.ARRAY,
            description: "A list of identified potential health hazards in the image.",
            items: {
                type: Type.OBJECT,
                properties: {
                    hazard: { type: Type.STRING, description: "The specific hazard identified, e.g., 'Stagnant Water Pool'." },
                    description: { type: Type.STRING, description: "A brief description of the hazard and its location in the image." }
                },
                required: ["hazard", "description"]
            }
        },
        diseases: {
            type: Type.ARRAY,
            description: "A list of potential diseases associated with the identified hazards.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the potential disease, e.g., 'Malaria'." },
                    cause: { type: Type.STRING, description: "How the identified hazards can cause this disease." },
                    precautions: {
                        type: Type.ARRAY,
                        description: "A list of practical preventive measures against this disease.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["name", "cause", "precautions"]
            }
        },
        summary: {
            type: Type.STRING,
            description: "A concise overall summary of the environmental health assessment, written in an urgent but informative tone."
        }
    },
    required: ["hazards", "diseases", "summary"]
};

export const analyzeImage = async (base64ImageData: string): Promise<AnalysisResult> => {
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };

    const textPart = {
        text: `You are an expert environmental health and public safety analyst named GeoSick. Analyze the provided image of a geographical area.
        1.  **Identify Potential Health Hazards:** Pinpoint any visible issues such as stagnant water, garbage piles, pollution, pests, or poor sanitation. Be specific.
        2.  **Predict Associated Diseases:** Based on the identified hazards, list potential diseases (e.g., Malaria from stagnant water, Cholera from contaminated water sources, respiratory issues from air pollution).
        3.  **Provide a Detailed Report:** Synthesize your findings into a clear, structured report.
        4.  **Suggest Actionable Precautions:** For each potential disease, provide a list of practical and effective preventive measures for individuals and the community.
        Your response must be in JSON format conforming to the provided schema.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AnalysisResult;
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("The model returned an invalid data format.");
    }
};

const prescriptionAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A concise summary of the prescription's purpose in simple, easy-to-understand language. Start with 'This prescription is for...'."
        },
        medicines: {
            type: Type.ARRAY,
            description: "A list of all prescribed medicines found in the image.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the medicine." },
                    dosage: { type: Type.STRING, description: "The dosage and frequency instructions (e.g., '500mg, twice a day for 7 days')." }
                },
                required: ["name", "dosage"]
            }
        },
        precautions: {
            type: Type.ARRAY,
            description: "A list of important precautions or advice mentioned in the prescription (e.g., 'Take with food', 'Avoid driving').",
            items: { type: Type.STRING }
        }
    },
    required: ["summary", "medicines", "precautions"]
};


export const analyzePrescription = async (base64ImageData: string): Promise<PrescriptionAnalysisResult> => {
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };

    const textPart = {
        text: `You are an expert medical transcriptionist. Analyze the provided image of a doctor's prescription, which may be handwritten or typed.
        1.  **Interpret the content:** Carefully read all text on the prescription.
        2.  **Extract Key Information:** Identify all prescribed medicines and their exact dosages/instructions.
        3.  **Identify Precautions:** Note any special warnings, advice, or precautions mentioned.
        4.  **Summarize:** Provide a brief, simple summary of the prescription's purpose.
        If any part of the prescription is illegible, state that clearly in the relevant field (e.g., 'Dosage illegible'). Do not guess.
        Your response must be in JSON format conforming to the provided schema.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: prescriptionAnalysisSchema
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PrescriptionAnalysisResult;
    } catch (e) {
        console.error("Failed to parse JSON from prescription analysis:", response.text);
        throw new Error("The model returned an invalid data format for the prescription.");
    }
};


let chatInstance: Chat | null = null;

export const startChat = (): Chat => {
    if (!chatInstance) {
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are a friendly and knowledgeable medical chatbot for the GeoSick application. Your purpose is to answer questions about diseases, their causes, symptoms, and prevention. Do not provide medical diagnoses or prescribe treatments. Always advise users to consult a healthcare professional for personal health concerns. Keep your answers clear, concise, and easy to understand.`,
            },
        });
    }
    return chatInstance;
};

export const sendMessageToBotStream = async (chat: Chat, message: string) => {
    return await chat.sendMessageStream({ message });
};


const geocodeSchema = {
    type: Type.OBJECT,
    properties: {
        lat: { type: Type.NUMBER, description: "Latitude coordinate" },
        lng: { type: Type.NUMBER, description: "Longitude coordinate" },
        foundLocationName: { type: Type.STRING, description: "The full, unambiguous name of the location the model identified (e.g., 'Springfield, Illinois, USA')." }
    },
    required: ["lat", "lng", "foundLocationName"],
};

export const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number; foundLocationName: string }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a world-class, high-precision geocoding system. Your ONLY function is to convert a textual location description into precise geographic coordinates (latitude, longitude) and a canonical, fully-qualified location name.

The user input may be a city, a village, a specific street address, or a famous landmark. You must handle all cases with the highest possible accuracy.

- For a **city, village, or administrative area**: Return the coordinates of its center.
- For a **street address**: Be as specific as possible. Attempt to find the exact point on the street.
- For a **landmark**: Return the coordinates of the landmark itself (e.g., 'Eiffel Tower, Paris, France').
- For **ambiguous names** (e.g., 'Springfield'): Use contextual clues if available. If not, default to the most globally recognized or populous location with that name (e.g., 'Springfield, Illinois, USA').

The user-provided location to geocode is: "${locationName}"

Return ONLY a single, valid JSON object that strictly adheres to the provided schema. The 'foundLocationName' MUST be the full, unambiguous name you have successfully geocoded.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: geocodeSchema,
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as { lat: number, lng: number, foundLocationName: string };
    } catch (e) {
        console.error("Failed to parse JSON from geocoding:", response.text);
        throw new Error("The model returned an invalid data format for geocoding.");
    }
};

const facilitiesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The official name of the facility." },
            type: { type: Type.STRING, enum: ['Hospital', 'Clinic', 'Pharmacy'], description: "The type of the facility." },
            lat: { type: Type.NUMBER, description: "The latitude coordinate of the facility." },
            lng: { type: Type.NUMBER, description: "The longitude coordinate of the facility." },
        },
        required: ["name", "type", "lat", "lng"],
    },
};

export const findFacilitiesByCoordinates = async (coords: { lat: number; lng: number }): Promise<Omit<Facility, 'distance'>[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `List real-world, public-facing hospitals, clinics, and pharmacies within a 5km radius of latitude ${coords.lat} and longitude ${coords.lng}. Exclude any other type of place. For each, provide its name, type (must be one of: Hospital, Clinic, Pharmacy), and its precise latitude and longitude.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: facilitiesSchema,
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Omit<Facility, 'distance'>[];
    } catch (e) {
        console.error("Failed to parse JSON from facility search:", response.text);
        throw new Error("The model returned an invalid data format for facilities.");
    }
};

const healthForecastSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING, description: "The name of the city/area for the forecast." },
        summary: { type: Type.STRING, description: "A concise, 1-2 sentence summary of the overall health outlook for the day." },
        riskFactors: {
            type: Type.ARRAY,
            description: "A list of key health risk factors for the day.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the risk factor (e.g., 'Air Quality', 'Pollen Count', 'UV Index')." },
                    level: { type: Type.STRING, enum: ['Low', 'Moderate', 'High', 'Very High'], description: "The assessed risk level." },
                    description: { type: Type.STRING, description: "A brief explanation of the risk." }
                },
                required: ["name", "level", "description"]
            }
        },
        recommendations: {
            type: Type.ARRAY,
            description: "A list of 2-4 actionable recommendations for the user based on the risks.",
            items: { type: Type.STRING }
        }
    },
    required: ["locationName", "summary", "riskFactors", "recommendations"]
};


export const getHealthForecast = async (coords: { lat: number; lng: number }): Promise<HealthForecast> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are GeoSick, a health intelligence AI. Act as a health meteorologist. Given the coordinates (latitude: ${coords.lat}, longitude: ${coords.lng}) and today's date, generate a daily health forecast. 
        1. Identify the location (city, country).
        2. Analyze plausible environmental risks for this region and season (e.g., air quality/AQI, pollen levels, UV index, heat stress, risk for common vector-borne diseases like flu or mosquito-borne illnesses).
        3. Output a JSON object with the location name, a summary, an array of 2-4 key risk factors (each with name, level, and description), and an array of 2-4 actionable recommendations. Be creative and base it on plausible environmental data.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: healthForecastSchema,
        }
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as HealthForecast;
    } catch (e) {
        console.error("Failed to parse JSON from health forecast:", response.text);
        throw new Error("The model returned an invalid data format for the health forecast.");
    }
};

const mentalHealthAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A compassionate, non-clinical summary of the user's self-reported feelings (2-3 sentences). Avoid diagnostic language."
        },
        potentialConcerns: {
            type: Type.ARRAY,
            description: "A list of potential areas for self-reflection based on the answers. Frame these neutrally (e.g., 'Feelings of Low Mood', 'Signs of Stress').",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the potential concern area." },
                    explanation: { type: Type.STRING, description: "A gentle, educational explanation of what this might mean in general terms." }
                },
                required: ["name", "explanation"]
            }
        },
        copingStrategies: {
            type: Type.ARRAY,
            description: "A list of 2-4 actionable, non-prescriptive, evidence-based coping strategies (e.g., 'Mindful Breathing', 'Journaling').",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the coping strategy." },
                    description: { type: Type.STRING, description: "A brief, practical guide on how to perform the strategy." }
                },
                required: ["title", "description"]
            }
        },
        recommendation: {
            type: Type.STRING,
            description: "A clear and direct recommendation to speak with a healthcare professional or mental health expert for a proper assessment. This should be consistent for all responses."
        }
    },
    required: ["summary", "potentialConcerns", "copingStrategies", "recommendation"]
};


export const analyzeMentalHealth = async (answers: Record<string, string>): Promise<MentalHealthResult> => {
    const prompt = `You are a compassionate AI assistant for the GeoSick app, focused on promoting mental wellness. You are NOT a medical professional and must not provide a diagnosis.
    A user has completed a self-assessment questionnaire. Your task is to analyze their answers and provide a supportive, non-clinical summary.

    User's Answers:
    ${Object.entries(answers).map(([question, answer]) => `- ${question}: ${answer}`).join('\n')}

    Based on these answers:
    1. Write a gentle, empathetic summary. Acknowledge their feelings without making clinical statements.
    2. Identify potential areas of concern in a non-judgmental way. These are not diagnoses, but observations.
    3. Suggest a few general, evidence-based coping strategies that anyone can use for well-being.
    4. Conclude with a clear, firm recommendation to consult a healthcare professional for genuine medical advice.

    Your response must be a single JSON object conforming to the provided schema. Do not add any extra text or explanations outside of the JSON structure.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: mentalHealthAnalysisSchema
        }
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as MentalHealthResult;
    } catch (e) {
        console.error("Failed to parse JSON from mental health analysis:", response.text);
        throw new Error("The model returned an invalid data format for the mental health analysis.");
    }
};

const symptomAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A brief, neutral summary of the user's reported symptoms in 1-2 sentences."
        },
        triageRecommendation: {
            type: Type.STRING,
            description: "A single, cautious triage recommendation. Must be one of: 'Consider self-care and monitor symptoms', 'Consult a healthcare professional for a proper diagnosis', 'Seek prompt medical attention if symptoms are severe or worsen'."
        },
        potentialConditions: {
            type: Type.ARRAY,
            description: "A list of 2-4 potential, common, non-emergency conditions that could be associated with the symptoms. Do not frame this as a diagnosis.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the potential condition." },
                    description: { type: Type.STRING, description: "A brief, general, educational description of the condition." }
                },
                required: ["name", "description"]
            }
        },
        nextSteps: {
            type: Type.ARRAY,
            description: "A list of 2-4 general, non-prescriptive next steps (e.g., 'Rest and stay hydrated', 'Keep a symptom diary', 'Avoid irritants').",
            items: { type: Type.STRING }
        },
        disclaimer: {
            type: Type.STRING,
            description: "A mandatory, clear disclaimer stating that this is an AI-generated analysis and not a substitute for professional medical advice. Must always contain the phrase 'Always consult a healthcare professional'."
        }
    },
    required: ["summary", "triageRecommendation", "potentialConditions", "nextSteps", "disclaimer"]
};

export const analyzeSymptoms = async (symptoms: string): Promise<SymptomAnalysisResult> => {
    const prompt = `You are GeoSick, an AI health information assistant. You are NOT a medical doctor and must not provide a diagnosis.
    A user has described their symptoms. Your task is to provide a cautious, informational analysis.

    User's Symptoms: "${symptoms}"

    Based on these symptoms:
    1.  Provide a very brief summary of the user's input.
    2.  Give a single, cautious triage recommendation from the allowed options. Prioritize safety; if in any doubt, advise seeing a professional.
    3.  List a few *potential* common conditions. This is NOT a diagnosis. Frame it as possibilities for discussion with a doctor.
    4.  Suggest general, non-medical next steps for self-care or observation.
    5.  Conclude with the mandatory, prominent disclaimer about consulting a professional.

    Your response must be a single JSON object conforming to the provided schema. Do not add any extra text or explanations.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: symptomAnalysisSchema
        }
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SymptomAnalysisResult;
    } catch (e) {
        console.error("Failed to parse JSON from symptom analysis:", response.text);
        throw new Error("The model returned an invalid data format for the symptom analysis.");
    }
};
