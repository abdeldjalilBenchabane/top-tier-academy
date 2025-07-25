
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Course, Level, Year, Speciality, Material, Language } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Layers, User, Calendar, FileText } from 'lucide-react';
import { toast } from '@/lib/toast';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Breadcrumb } from '@/types';

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLanguageLevel, setSelectedLanguageLevel] = useState('');
  const [courseType, setCourseType] = useState<'all' | 'structure' | 'language'>('all');
  const [languageLevels, setLanguageLevels] = useState<any[]>([]);
  
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [currentYear, setCurrentYear] = useState<Year | null>(null);
  const [currentSpeciality, setCurrentSpeciality] = useState<Speciality | null>(null);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [coursesData, levelsData, yearsData, specialitiesData, materialsData, languagesData, languageLevelsData] = await Promise.all([
          api.getCourses(),
          api.getLevels(),
          api.getAllYears(), // changed from api.getYears()
          api.getAllSpecialities(), // changed from api.getSpecialities()
          api.getAllMaterials(), // changed from api.getMaterials()
          api.getLanguages(), // fetch all languages
          api.getAllLanguageLevels(), // fetch all language levels
        ]);
        

        

        
        setCourses(coursesData);
        setLevels(levelsData);
        setYears(yearsData);
        setSpecialities(specialitiesData);
        setMaterials(materialsData);
        setLanguages(languagesData);
        setLanguageLevels(languageLevelsData);
        
        const materialIdFromUrl = searchParams.get('materialId');
        if (materialIdFromUrl) {
          setSelectedMaterialId(materialIdFromUrl);
          
          const material = materialsData.find(m => m.id === materialIdFromUrl) || null;
          setCurrentMaterial(material);
          
          if (material) {
            const speciality = specialitiesData.find(s => s.id === material.specialityId) || null;
            setCurrentSpeciality(speciality);
            setSelectedSpeciality(speciality?.id || '');
            
            if (speciality) {
              const year = yearsData.find(y => y.id === speciality.yearId) || null;
              setCurrentYear(year);
              setSelectedYear(year?.id || '');
              
              if (year) {
                const level = levelsData.find(l => l.id === year.levelId) || null;
                setCurrentLevel(level);
                setSelectedLevel(level?.id || '');
              }
            }
          }
        }
        
        setFilteredCourses(coursesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load courses data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [searchParams]);

  useEffect(() => {
    let filtered = [...courses];
    

    
    // Filter by course type first
    if (courseType !== 'all') {
      if (courseType === 'structure') {
        filtered = filtered.filter(course => course.materialId && !course.languageLevelId);
      } else if (courseType === 'language') {
        filtered = filtered.filter(course => course.languageLevelId && !course.materialId);
      }
    }
    
    // Filter by language path
    if (courseType === 'all' || courseType === 'language') {
      if (selectedLanguageLevel && selectedLanguageLevel !== 'all') {
        filtered = filtered.filter(course => course.languageLevelId === selectedLanguageLevel);
      } else if (selectedLanguage && selectedLanguage !== 'all') {
        // Get language levels for this language
        const languageLevelIds = languageLevels
          .filter(ll => ll.languageId === selectedLanguage)
          .map(ll => ll.id);
        
        if (languageLevelIds.length > 0) {
          filtered = filtered.filter(course => 
            course.languageLevelId && languageLevelIds.includes(course.languageLevelId)
          );
        }
      }
    }
    
    // Filter by educational structure path
    if (courseType === 'all' || courseType === 'structure') {
      if (selectedMaterialId && selectedMaterialId !== 'all') {
      filtered = filtered.filter(course => course.materialId === selectedMaterialId);
    }
      else if (selectedSpeciality && selectedSpeciality !== 'all') {
        // Get materials linked to this speciality
        const materialIds = materials
          .filter(m => m.specialityId === selectedSpeciality)
          .map(m => m.id);
        
        if (materialIds.length > 0) {
          filtered = filtered.filter(course => course.materialId && materialIds.includes(course.materialId));
        } else {
          // No materials for this speciality, show no courses
          filtered = [];
        }
      }
      else if (selectedYear && selectedYear !== 'all') {
        // Get materials linked to specialities in this year OR direct materials in this year
        const specialityIds = specialities
          .filter(s => s.yearId === selectedYear)
          .map(s => s.id);
        
        const materialIds = materials
          .filter(m => 
            (m.specialityId && specialityIds.includes(m.specialityId)) || 
            (m.yearId === selectedYear)
          )
          .map(m => m.id);
        
        if (materialIds.length > 0) {
          filtered = filtered.filter(course => course.materialId && materialIds.includes(course.materialId));
        } else {
          // No materials for this year, show no courses
          filtered = [];
        }
      }
      else if (selectedLevel && selectedLevel !== 'all') {
        // Get materials linked to specialities in years of this level OR direct materials in years of this level
        const yearIds = years
          .filter(y => y.levelId === selectedLevel)
          .map(y => y.id);
        
        const specialityIds = specialities
          .filter(s => s.yearId && yearIds.includes(s.yearId))
          .map(s => s.id);
        
        const materialIds = materials
          .filter(m => 
            (m.specialityId && specialityIds.includes(m.specialityId)) || 
            (m.yearId && yearIds.includes(m.yearId))
          )
          .map(m => m.id);
        
        if (materialIds.length > 0) {
          filtered = filtered.filter(course => course.materialId && materialIds.includes(course.materialId));
        } else {
          // No materials for this level, show no courses
          filtered = [];
        }
      }
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        course => 
          course.title.toLowerCase().includes(term) || 
          course.description.toLowerCase().includes(term)
      );
    }

    setFilteredCourses(filtered);
  }, [
    courses, 
    searchTerm, 
    courseType,
    selectedLanguage,
    selectedLanguageLevel,
    selectedMaterialId, 
    selectedLevel, 
    selectedYear, 
    selectedSpeciality,
    materials,
    specialities,
    years,
    languageLevels
  ]);

  useEffect(() => {
    if (!selectedLevel) {
      setSelectedYear('');
      setSelectedSpeciality('');
      setSelectedMaterialId('');
    }
  }, [selectedLevel]);
  
  useEffect(() => {
    if (!selectedYear) {
      setSelectedSpeciality('');
      setSelectedMaterialId('');
    }
  }, [selectedYear]);
  
  useEffect(() => {
    if (!selectedSpeciality) {
      setSelectedMaterialId('');
    }
  }, [selectedSpeciality]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFilteredYears = () => {
    return selectedLevel && selectedLevel !== 'all'
      ? years.filter(year => year.levelId === selectedLevel)
      : [];
  };
  
  const getFilteredSpecialities = () => {
    return selectedYear && selectedYear !== 'all'
      ? specialities.filter(spec => spec.yearId === selectedYear)
      : [];
  };
  
  const getFilteredMaterials = () => {
    if (selectedSpeciality && selectedSpeciality !== 'all') {
      // Get materials linked to this speciality
      return materials.filter(mat => mat.specialityId === selectedSpeciality);
    } else if (selectedYear && selectedYear !== 'all') {
      // Get materials linked to specialities in this year OR direct materials in this year
      const specialityIds = specialities
        .filter(s => s.yearId === selectedYear)
        .map(s => s.id);
      
      return materials.filter(m => 
        (m.specialityId && specialityIds.includes(m.specialityId)) || 
        (m.yearId === selectedYear)
      );
    } else if (selectedLevel && selectedLevel !== 'all') {
      // Get materials linked to specialities in years of this level OR direct materials in years of this level
      const yearIds = years
        .filter(y => y.levelId === selectedLevel)
        .map(y => y.id);
      
      const specialityIds = specialities
        .filter(s => s.yearId && yearIds.includes(s.yearId))
        .map(s => s.id);
      
      return materials.filter(m => 
        (m.specialityId && specialityIds.includes(m.specialityId)) || 
        (m.yearId && yearIds.includes(m.yearId))
      );
    }
    return [];
  };

  const getFilteredLanguageLevels = () => {
    return selectedLanguage && selectedLanguage !== 'all'
      ? languageLevels.filter(ll => ll.language_id === selectedLanguage)
      : [];
  };

  const getBreadcrumbs = (): Breadcrumb[] => {
    const crumbs: Breadcrumb[] = [
      { name: 'Courses', href: '/admin/courses' }
    ];
    
    if (currentLevel) {
      crumbs.push({ name: currentLevel.name, href: `/admin/courses?level=${currentLevel.id}` });
    }
    
    if (currentYear) {
      crumbs.push({ name: currentYear.name, href: `/admin/courses?year=${currentYear.id}` });
    }
    
    if (currentSpeciality) {
      crumbs.push({ name: currentSpeciality.name, href: `/admin/courses?speciality=${currentSpeciality.id}` });
    }
    
    if (currentMaterial) {
      crumbs.push({ 
        name: currentMaterial.name, 
        href: `/admin/courses?materialId=${currentMaterial.id}`,
        current: true 
      });
    }
    
    if (currentLanguage) {
      crumbs.push({ name: currentLanguage.name, href: `/admin/courses?language=${currentLanguage.id}` });
    }
    
    return crumbs;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCourseType('all');
    setSelectedLevel('');
    setSelectedYear('');
    setSelectedSpeciality('');
    setSelectedMaterialId('');
    setSelectedLanguage('');
    setSelectedLanguageLevel('');
    setCurrentLevel(null);
    setCurrentYear(null);
    setCurrentSpeciality(null);
    setCurrentMaterial(null);
    setCurrentLanguage(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={currentMaterial ? `Courses in ${currentMaterial.name}` : "All Courses"} 
        description="Browse and manage all approved courses"
        breadcrumbs={getBreadcrumbs()}
      />
      
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/2 lg:w-2/3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search courses..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="w-full sm:w-1/2 lg:w-1/3">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Course Type Filter */}
                <Select
                  value={courseType}
                  onValueChange={(value: 'all' | 'structure' | 'language') => {
                    setCourseType(value);
                    // Reset filters when changing course type
                    if (value === 'all') {
                      // Reset all filters when switching to "All Courses"
                      setSelectedLevel('');
                      setSelectedYear('');
                      setSelectedSpeciality('');
                      setSelectedMaterialId('');
                      setSelectedLanguage('');
                      setSelectedLanguageLevel('');
                      setCurrentLevel(null);
                      setCurrentYear(null);
                      setCurrentSpeciality(null);
                      setCurrentMaterial(null);
                      setCurrentLanguage(null);
                    } else if (value === 'language') {
                      setSelectedLevel('');
                      setSelectedYear('');
                      setSelectedSpeciality('');
                      setSelectedMaterialId('');
                    } else if (value === 'structure') {
                      setSelectedLanguage('');
                      setSelectedLanguageLevel('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Course Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="structure">Educational Structure</SelectItem>
                    <SelectItem value="language">Languages</SelectItem>
                  </SelectContent>
                </Select>
                
                                {/* Language Filter - Only show for language courses */}
                {(courseType === 'all' || courseType === 'language') && (
                  <>
                    <Select
                      value={selectedLanguage}
                      onValueChange={(value) => {
                        setSelectedLanguage(value);
                        setSelectedLanguageLevel(''); // Reset language level when language changes
                      }}
                      disabled={courseType === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map((lang) => (
                          <SelectItem key={`lang-${lang.id}`} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                    <Select
                      value={selectedLanguageLevel}
                      onValueChange={(value) => setSelectedLanguageLevel(value)}
                      disabled={courseType === 'all' || !selectedLanguage || selectedLanguage === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedLanguage && selectedLanguage !== 'all' ? "Select Level" : "Select Language First"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {getFilteredLanguageLevels().map((level) => (
                          <SelectItem key={`langlevel-${level.id}`} value={level.id}>
                            {level.name} ({level.description || 'Level'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                
                {/* Educational Structure Filters - Only show for structure courses */}
                {(courseType === 'all' || courseType === 'structure') && (
                  <>
                <Select
                  value={selectedLevel}
                  onValueChange={(value) => {
                    setSelectedLevel(value);
                    setCurrentLevel(levels.find(l => l.id === value) || null);
                        // Reset dependent filters
                        setSelectedYear('');
                        setSelectedSpeciality('');
                        setSelectedMaterialId('');
                  }}
                  disabled={courseType === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={`level-${level.id}`} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedYear}
                  onValueChange={(value) => {
                    setSelectedYear(value);
                    setCurrentYear(years.find(y => y.id === value) || null);
                        // Reset dependent filters
                        setSelectedSpeciality('');
                        setSelectedMaterialId('');
                        
                                                 // If the selected year has no specialities, we can show materials directly
                         if (value && value !== 'all') {
                           const yearSpecialities = specialities.filter(s => s.yearId === value);
                           if (yearSpecialities.length === 0) {
                             // Year has no specialities, materials will be shown directly
                           }
                         }
                  }}
                      disabled={courseType === 'all' || !selectedLevel || selectedLevel === 'all'}
                >
                  <SelectTrigger>
                        <SelectValue placeholder={selectedLevel && selectedLevel !== 'all' ? "Select Year" : "Select Level First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {getFilteredYears().map((year) => (
                          <SelectItem key={`year-${year.id}`} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedSpeciality}
                  onValueChange={(value) => {
                    setSelectedSpeciality(value);
                    setCurrentSpeciality(specialities.find(s => s.id === value) || null);
                        // Reset dependent filters
                        setSelectedMaterialId('');
                  }}
                      disabled={courseType === 'all' || !selectedYear || selectedYear === 'all'}
                >
                  <SelectTrigger>
                        <SelectValue placeholder={selectedYear && selectedYear !== 'all' ? "Select Speciality" : "Select Year First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialities</SelectItem>
                    {getFilteredSpecialities().map((spec) => (
                          <SelectItem key={`spec-${spec.id}`} value={spec.id}>
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedMaterialId}
                  onValueChange={(value) => {
                    setSelectedMaterialId(value);
                    setCurrentMaterial(materials.find(m => m.id === value) || null);
                  }}
                      disabled={courseType === 'all' || !selectedYear || selectedYear === 'all'}
                >
                  <SelectTrigger>
                        <SelectValue placeholder={selectedYear && selectedYear !== 'all' ? "Select Material" : "Select Year First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    {getFilteredMaterials().map((material) => (
                          <SelectItem key={`material-${material.id}`} value={material.id}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div>
          {courses.length === 0 ? (
            <EmptyState
              title="No Courses Available"
              description="There are no courses in the system yet."
              icon={<BookOpen className="h-12 w-12 text-gray-400" />}
            />
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              title="No Matching Courses"
              description="Try adjusting your search or filters to find courses."
              icon={<Search className="h-12 w-12 text-gray-400" />}
              action={{
                label: "Reset Filters",
                onClick: resetFilters
              }}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map(course => {
                // Handle educational structure courses
                let pathDisplay = null;
                if (course.materialId) {
                const material = materials.find(m => m.id === course.materialId);
                  if (material) {
                    let speciality = null;
                    let year = null;
                    let level = null;
                    
                    if (material.specialityId) {
                      // Material linked to speciality
                      speciality = specialities.find(s => s.id === material.specialityId);
                      if (speciality) {
                        year = years.find(y => y.id === speciality.yearId);
                        if (year) {
                          level = levels.find(l => l.id === year.levelId);
                        }
                      }
                    } else if (material.yearId) {
                      // Direct material linked to year
                      year = years.find(y => y.id === material.yearId);
                      if (year) {
                        level = levels.find(l => l.id === year.levelId);
                      }
                    }
                    
                    if (level && year) {
                      if (speciality) {
                        pathDisplay = `${level.name} > ${year.name} > ${speciality.name} > ${material.name}`;
                      } else {
                        pathDisplay = `${level.name} > ${year.name} > ${material.name}`;
                      }
                    }
                  }
                }
                
                // Handle language courses
                let languageDisplay = null;
                if (course.languageLevelId) {
                  const language = languages.find(l => l.id === course.languageLevelId);
                  if (language) {
                    languageDisplay = `Language: ${language.name}`;
                  }
                }
                
                return (
                  <Card key={course.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="flex items-center text-xs">
                        <User className="h-3.5 w-3.5 mr-1" />
                        <span>Professor</span>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {course.description}
                      </p>
                      
                      {pathDisplay && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-xs flex items-center">
                            <Layers className="h-3 w-3 mr-1" />
                            {pathDisplay}
                          </Badge>
                        </div>
                      )}
                      
                      {languageDisplay && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-xs flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {languageDisplay}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>Approved: {formatDate(course.approvedAt || course.createdAt)}</span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center"
                        asChild
                      >
                        <Link to={`/admin/courses/${course.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Course
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
