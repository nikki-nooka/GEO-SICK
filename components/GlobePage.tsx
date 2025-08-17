

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { analyzeLocationByCoordinates, geocodeLocation } from '../services/geminiService';
import { addHistoryEvent } from '../services/historyService';
import type { LocationAnalysisResult, User } from '../types';
import { LocationReport } from './LocationReport';
import { ArrowLeftIcon, MapPinIcon, MagnifyingGlassIcon, CloseIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

export const GlobePage: React.FC<{ user: User | null, onBack: () => void }> = ({ user, onBack }) => {
  const [analysis, setAnalysis] = useState<{ result: LocationAnalysisResult, imageUrl: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const globeEl = useRef<any>(null);

  const [globeDimensions, setGlobeDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add state to track when the globe is fully initialized
  const [isGlobeReady, setIsGlobeReady] = useState(false);

  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [geocodedName, setGeocodedName] = useState<string | null>(null);

  // Effect to handle container dimensions
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setGlobeDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to set the initial globe view once it's ready
  useEffect(() => {
    if (isGlobeReady && globeEl.current) {
      // Set initial zoom
      globeEl.current.pointOfView({ altitude: 3.5 }, 0);
    }
  }, [isGlobeReady]);

  const startAnalysis = useCallback(async (lat: number, lng: number, locationName?: string) => {
    if (isLoading) return;

    if (globeEl.current) {
      globeEl.current.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
    }
    
    setClickedCoords({ lat, lng });
    setIsPanelOpen(true);
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const { analysis, imageUrl } = await analyzeLocationByCoordinates(lat, lng, locationName);
      setAnalysis({ result: analysis, imageUrl: imageUrl });
      if (user) {
        addHistoryEvent(user.nickname, 'location_analysis', { result: analysis, coords: { lat, lng } });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the location. The AI model may be unavailable or the request was blocked. Please try another location.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, user]);

  const handleGlobeClick = useCallback(({ lat, lng }: { lat: number, lng: number }) => {
    setGeocodedName(null);
    startAnalysis(lat, lng);
  }, [startAnalysis]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    
    setIsSearching(true);
    setSearchError(null);
    setGeocodedName(null);
    
    try {
        const { lat, lng, foundLocationName } = await geocodeLocation(searchQuery);
        setGeocodedName(foundLocationName);
        startAnalysis(lat, lng, foundLocationName);
    } catch (err) {
        console.error("Geocoding error:", err);
        setSearchError("Could not find that location. Please try a different name.");
    } finally {
        setIsSearching(false);
    }
  };
  
  const closePanel = () => {
      setIsPanelOpen(false);
      setSearchQuery('');
      setSearchError(null);
      setGeocodedName(null);
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden animate-fade-in bg-black">
      {globeDimensions.width > 0 && (
          <Globe
            ref={globeEl}
            width={globeDimensions.width}
            height={globeDimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            onGlobeClick={handleGlobeClick}
            atmosphereColor="lightblue"
            atmosphereAltitude={0.25}
            onGlobeReady={() => setIsGlobeReady(true)}
          />
      )}

      {/* Search Bar */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md transition-opacity duration-500 z-20 ${isPanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location..."
            className="w-full pl-4 pr-12 py-3 bg-white/80 backdrop-blur-md border border-slate-300/50 rounded-full shadow-lg placeholder-slate-500 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-slate-400 transition-colors"
            aria-label="Search location"
          >
            {isSearching ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <MagnifyingGlassIcon className="w-5 h-5" />}
          </button>
        </form>
        {searchError && <p className="text-center text-sm text-red-400 mt-2 bg-black/50 p-2 rounded-md">{searchError}</p>}
      </div>

      {/* Analysis Panel */}
      <div className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white/80 backdrop-blur-md shadow-2xl transition-transform duration-500 ease-in-out transform z-30 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 truncate pr-2">
                    {analysis?.result.locationName || geocodedName || 'Location Analysis'}
                </h2>
                <button onClick={closePanel} className="p-2 rounded-full hover:bg-slate-200 flex-shrink-0">
                    <CloseIcon className="w-6 h-6 text-slate-600" />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-slate-600 font-semibold">Analyzing Location...</p>
                        <p className="mt-1 text-sm text-slate-500">Generating report and satellite image.</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 m-4" role="alert">
                        <p className="font-bold">Analysis Error</p>
                        <p>{error}</p>
                    </div>
                )}
                {analysis && clickedCoords && <LocationReport result={analysis.result} imageUrl={analysis.imageUrl} coords={clickedCoords} />}
            </div>
        </div>
      </div>

      {/* Instruction Box */}
      <div className={`absolute top-1/2 -translate-y-1/2 left-4 p-4 animate-fade-in-up transition-opacity duration-500 z-10 ${isPanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg text-center">
              <MapPinIcon className="w-12 h-12 mx-auto text-blue-500 mb-2"/>
              <h2 className="text-xl font-bold text-slate-800">Explore the Globe</h2>
              <p className="text-slate-600 mt-1">Click or search to begin analysis.</p>
          </div>
      </div>
      
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 bg-white/80 backdrop-blur-md text-slate-700 font-semibold py-2 px-4 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-white z-20"
        aria-label="Back to Welcome Page"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>
    </div>
  );
};
