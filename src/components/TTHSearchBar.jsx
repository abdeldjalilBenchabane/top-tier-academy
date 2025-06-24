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
    <form onSubmit={handleSearch} className="relative ml-20  w-[80%] max-w-md mt-9">
      <div className="relative md:mr-0 mr-10">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-6 py-[0.6rem] pr-16 rounded-sm text-gray-700 focus:outline-none border border-gray-300 focus:border-cyan-500"
          placeholder="تعلم اليوم؟"
          maxLength={100}
          dir="rtl"
        />
        
        <button 
          type="submit"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-2 rounded-sm text-sm flex  items-center"
        >
          <FaSearch className="" />
          بحث
        </button>
        
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-200 "
        >
          <FaFilter />
        </button>
      </div>

     
      {showFilters && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">الكل</option>
                <option value="languages">اللغات</option>
                <option value="sciences">العلوم</option>
                <option value="programming">البرمجة</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستوى</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">الكل</option>
                <option value="beginner">مبتدئ</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">متقدم</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({...filters, language: e.target.value})}
                className="w-full p-2 border rounded"
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