import React,{ useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    language: 'ar'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fonction de validation et nettoyage de l'input
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Nettoyage du texte
    const cleanedTerm = searchTerm
      .replace(/[<>"'`;=]/g, '') // Supprime les caractères dangereux
      .trim()
      .substring(0, 100); // Limite à 100 caractères

    // Construction de la requête sécurisée
    const query = new URLSearchParams({
      q: cleanedTerm,
      ...filters
    }).toString();

    console.log('Recherche sécurisée:', query);
    // Ici vous pourriez faire appel à votre API
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md mt-6 sm:mt-8 md:mt-9">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 sm:px-6 py-3 sm:py-[0.6rem] pr-20 sm:pr-16 rounded-sm text-gray-700 focus:outline-none border border-gray-300 focus:border-cyan-500 text-sm sm:text-base"
          placeholder="تعلم اليوم؟"
          maxLength={100}
          dir="rtl"
        />
        
        <button 
          type="submit"
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white px-3 sm:px-4 md:px-8 py-2 rounded-sm text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
        >
          <FaSearch className="text-xs sm:text-sm" />
          <span className="hidden sm:inline">بحث</span>
        </button>
        
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
        >
          <FaFilter className="text-sm sm:text-base" />
        </button>
      </div>

     
      {showFilters && (
        <div className="mt-2 p-3 sm:p-4 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full p-2 text-xs sm:text-sm border rounded"
              >
                <option value="">الكل</option>
                <option value="languages">اللغات</option>
                <option value="sciences">العلوم</option>
                <option value="programming">البرمجة</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">المستوى</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="w-full p-2 text-xs sm:text-sm border rounded"
              >
                <option value="">الكل</option>
                <option value="beginner">مبتدئ</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">متقدم</option>
              </select>
            </div>
            
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">اللغة</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({...filters, language: e.target.value})}
                className="w-full p-2 text-xs sm:text-sm border rounded"
              >
                <option value="ar">العربية</option>
                <option value="fr">الفرنسية</option>
                <option value="en">الإنجليزية</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default SearchBar;