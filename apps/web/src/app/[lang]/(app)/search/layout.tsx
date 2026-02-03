"use client"
import { useUI } from '@/context/ui-context';
import SearchFilters from './_components/SearchFilters';
import SearchBar from '@/components/Search/SearchBar';

export default function Search({ children }: { children: React.ReactNode }) {
  const { device } = useUI();
  return (
    <div className="p-4">
      {device === 'mobile' ? <div className={`flex flex-col gap-4 pb-4`}>
        <SearchBar />
      </div> : null}
      <div className="@container/search flex flex-col gap-2">
        <SearchFilters />
        {children}
      </div>
    </div>
  );
}
