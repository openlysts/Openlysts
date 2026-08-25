import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [selectedForCompare, setSelectedForCompare] = useState(() => {
    try {
      const stored = localStorage.getItem('openlyst_compare');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('openlyst_compare', JSON.stringify(selectedForCompare));
  }, [selectedForCompare]);

  const toggleCompare = (repo) => {
    const exists = selectedForCompare.some(r => (r.id && repo.id && r.id === repo.id) || r.full_name === repo.full_name);
    if (exists) {
      setSelectedForCompare(prev => prev.filter(r => !((r.id && repo.id && r.id === repo.id) || r.full_name === repo.full_name)));
    } else {
      if (selectedForCompare.length >= 3) {
        toast({
          title: "Limit Reached",
          description: "You can only compare up to 3 repositories at a time.",
          variant: "destructive"
        });
        return;
      }
      setSelectedForCompare(prev => [...prev, { id: repo.id, name: repo.name, full_name: repo.full_name, stars: repo.stars }]);
      toast({
        title: "Added to Compare",
        description: `${repo.name} added to comparison.`,
      });
    }
  };

  const clearCompare = () => {
    setSelectedForCompare([]);
  };

  const removeFromCompare = (repoId) => {
    setSelectedForCompare(prev => prev.filter(r => r.id !== repoId));
  };

  const value = React.useMemo(() => ({
    selectedForCompare,
    toggleCompare,
    clearCompare,
    removeFromCompare
  }), [selectedForCompare]);

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
