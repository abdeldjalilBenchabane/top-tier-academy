import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Course, User, Material, Speciality, Year, Level, PendingCourse, LanguageLevel } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Book, User as UserIcon, Calendar, ArrowLeft, Layers, 
  FileText, Video, Image as ImageIcon, BookOpen, 
  AlertCircle, Download
} from 'lucide-react';
import { toast } from '@/lib/toast';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Breadcrumb } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminPathSelector from '@/components/admin/AdminPathSelector';

const CourseDetailsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [pendingCourse, setPendingCourse] = useState<PendingCourse | null>(null);
  const [professor, setProfessor] = useState<User | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [speciality, setSpeciality] = useState<Speciality | null>(null);
  const [year, setYear] = useState<Year | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [languageLevel, setLanguageLevel] = useState<LanguageLevel | null>(null);
  const [language, setLanguage] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProfessor, setIsLoadingProfessor] = useState(true);
  // Add state for cover upload
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  // Add state for image reload attempts
  const [coverReloadKey, setCoverReloadKey] = useState(0);
  // Add state for AdminPathSelector
  const [showPathSelector, setShowPathSelector] = useState(false);

  // Check if course needs path assignment
  const needsPathAssignment = course && course.status === 'approved' && 
    !course.materialId && !course.language_level_id;

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;
      setIsLoading(true);
      setIsLoadingProfessor(true);
      try {
        // Always fetch from backend
        const courseData = await api.getCourseById(courseId);
        console.log('COURSE DATA', courseData);
        if (courseData) {
          setCourse(courseData);
          // Load professor data for approved course
          if (courseData.createdBy) {
            try {
              const professorData = await api.getProfessorById(courseData.createdBy);
              setProfessor(professorData);
            } catch (err) {
              console.error('Failed to load professor:', err);
              toast.error('Failed to load professor information');
            } finally {
              setIsLoadingProfessor(false);
            }
          } else {
            setIsLoadingProfessor(false);
          }
          // Load course path data (material, speciality, year, level)
          if (courseData.materialId) {
            const materialsData = await api.getAllMaterials();
            const materialData = materialsData.find(m => m.id === courseData.materialId);
            setMaterial(materialData || null);
            
            let specialityData = null;
            let yearData = null;
            let levelData = null;
            
            // Handle speciality if present
            if (courseData.specialityId) {
              const specialitiesData = await api.getAllSpecialities();
              specialityData = specialitiesData.find(s => s.id === courseData.specialityId);
              setSpeciality(specialityData || null);
            } else if (materialData && materialData.speciality_id) {
              // Material is linked to a speciality
              const specialitiesData = await api.getAllSpecialities();
              specialityData = specialitiesData.find(s => s.id === materialData.speciality_id);
              setSpeciality(specialityData || null);
            } else {
              setSpeciality(null);
            }
            
            // Handle year - can come from course data or speciality
            if (courseData.yearId) {
              const yearsData = await api.getAllYears();
              yearData = yearsData.find(y => y.id === courseData.yearId);
              setYear(yearData || null);
            } else if (specialityData && specialityData.yearId) {
              const yearsData = await api.getAllYears();
              yearData = yearsData.find(y => y.id === specialityData.yearId);
              setYear(yearData || null);
            } else if (materialData && materialData.year_id) {
              // Material is directly linked to year
              const yearsData = await api.getAllYears();
              yearData = yearsData.find(y => y.id === materialData.year_id);
              setYear(yearData || null);
            }
            
            // Handle level - can come from course data or year
            if (courseData.levelId) {
              const levelsData = await api.getLevels();
              levelData = levelsData.find(l => l.id === courseData.levelId);
              setLevel(levelData || null);
            } else if (yearData && yearData.level_id) {
              const levelsData = await api.getLevels();
              levelData = levelsData.find(l => l.id === yearData.level_id);
              setLevel(levelData || null);
            }
            
            // Debug logging
            console.log('Path loading debug:', {
              courseData: {
                levelId: courseData.levelId,
                yearId: courseData.yearId,
                specialityId: courseData.specialityId,
                materialId: courseData.materialId
              },
              materialData: materialData ? {
                id: materialData.id,
                name: materialData.name,
                year_id: materialData.year_id,
                speciality_id: materialData.speciality_id
              } : null,
              specialityData: specialityData ? {
                id: specialityData.id,
                name: specialityData.name,
                yearId: specialityData.yearId
              } : null,
              yearData: yearData ? {
                id: yearData.id,
                name: yearData.name,
                level_id: yearData.level_id
              } : null,
              levelData: levelData ? {
                id: levelData.id,
                name: levelData.name
              } : null
            });
          }
          // If language_level_id, fetch and set language level and language
          if (courseData.language_level_id) {
            try {
              const allLanguageLevels = await api.getAllLanguageLevels();
              const foundLevel = allLanguageLevels.find(lvl => lvl.id === courseData.language_level_id);
              setLanguageLevel(foundLevel || null);
              if (foundLevel) {
                const allLanguages = await api.getLanguages();
                // Try both language_id and languageId for robustness
                const langId = foundLevel.language_id || foundLevel.languageId;
                const foundLang = allLanguages.find(lang => lang.id == langId);
                setLanguage(foundLang ? { id: foundLang.id, name: foundLang.name } : null);
                console.log('LANG DEBUG', { foundLevel, foundLang });
              } else {
                setLanguage(null);
              }
            } catch (err) {
              setLanguageLevel(null);
              setLanguage(null);
            }
          } else {
            setLanguageLevel(null);
            setLanguage(null);
          }
        } else {
          toast.error('Course not found');
          navigate('/admin/courses');
          return;
        }
      } catch (error) {
        console.error('Failed to load course data:', error);
        toast.error('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };
    loadCourseData();
  }, [courseId, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'pdf':
        return <Book className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getBreadcrumbs = (): Breadcrumb[] => {
    const crumbs: Breadcrumb[] = [
      { name: 'Courses', href: '/admin/courses' }
    ];
    
    if (level) {
      crumbs.push({ name: level.name, href: `/admin/courses?level=${level.id}` });
    }
    
    if (year) {
      crumbs.push({ name: year.name, href: `/admin/courses?year=${year.id}` });
    }
    
    if (speciality) {
      crumbs.push({ name: speciality.name, href: `/admin/courses?speciality=${speciality.id}` });
    }
    
    if (material) {
      crumbs.push({ 
        name: material.name, 
        href: `/admin/courses?materialId=${material.id}`
      });
    }
    
    if (course) {
      crumbs.push({ 
        name: course.title, 
        href: `/admin/courses/${courseId}`,
        current: true 
      });
    }
    
    return crumbs;
  };

  const getStoredFile = (fileId: string) => {
    return localStorage.getItem(fileId);
  };

  const isFileReference = (content: string) => {
    return content.includes('block_') && content.includes('_');
  };

  const getFilenameFromReference = (fileRef: string) => {
    if (!isFileReference(fileRef)) return fileRef;
    
    const parts = fileRef.split('_');
    return parts.slice(1).join('_');
  };

  // Handler for cover change
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setCoverFile(file);
    setIsUploadingCover(true);
    // Show local preview
    const previewUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(previewUrl);
    try {
      if (!course) throw new Error('No course loaded');
      const newCoverUrl = await api.uploadCourseCover(course.id, file);
      setCourse({ ...course, cover_url: `${newCoverUrl}?t=${Date.now()}` });
      setCoverPreviewUrl(null); // Switch to server image
      setCoverReloadKey(prev => prev + 1); // Force <img> reload
      toast.success('Course cover updated!');
    } catch (err) {
      console.error('Failed to upload cover:', err);
      toast.error('Failed to upload course cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg font-medium">Course not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>
    );
  }

  console.log('LANG DEBUG (render)', { languageLevel, language });
  return (
    <div className="space-y-6">
      <PageHeader 
        title={course.title}
        description="Course content and details"
        breadcrumbs={getBreadcrumbs()}
        action={
          <Button variant="outline" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Professor</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfessor ? (
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ) : professor ? (
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {professor.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{professor.name}</h3>
                    <p className="text-sm text-gray-500">{professor.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-amber-100 text-amber-700">
                      NA
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-800">Professor not available</h3>
                    <p className="text-sm text-gray-500">Contact administrator</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm mt-1">{course.description}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Path</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {needsPathAssignment ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs text-orange-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No path assigned
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPathSelector(true)}
                        className="text-xs"
                      >
                        Assign Path
                      </Button>
                    </div>
                  ) : (
                  <Badge variant="outline" className="text-xs flex items-center">
                    <Layers className="h-3 w-3 mr-1" />
                      {languageLevel && language ? (
                        <>{language.name} &gt; {languageLevel.name}</>
                      ) : languageLevel && !language ? (
                        <>Unknown Language &gt; {languageLevel.name}</>
                      ) : !languageLevel && language ? (
                        <>{language.name} &gt; Unknown Level</>
                      ) : (
                        <>
                    {level && <>{level.name}</>}
                    {level && year && <>&nbsp;&gt;&nbsp;</>}
                    {year && <>{year.name}</>}
                    {year && speciality && <>&nbsp;&gt;&nbsp;</>}
                    {speciality && <>{speciality.name}</>}
                      {(speciality || (!speciality && material)) && <>&nbsp;&gt;&nbsp;</>}
                    {material && <>{material.name}</>}
                        </>
                      )}
                  </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-1">{formatDate(course.createdAt)}</span>
                </div>
                {course.approvedAt && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500">Approved:</span>
                    <span className="ml-1">{formatDate(course.approvedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Course Cover Card */}
          {(coverPreviewUrl || course.cover_url) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Course Cover</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  key={(coverPreviewUrl || course.cover_url) + '-' + coverReloadKey}
                  src={coverPreviewUrl || course.cover_url}
                  alt="Course Cover"
                  className="w-full h-auto rounded-md object-cover border mb-2"
                  style={{ maxHeight: 300 }}
                  onError={() => {
                    // If the server is slow to serve the new file, retry after 1s
                    if (!coverPreviewUrl) {
                      setTimeout(() => setCoverReloadKey(k => k + 1), 1000);
                    }
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  id="cover-upload-input"
                  style={{ display: 'none' }}
                  onChange={handleCoverChange}
                  disabled={isUploadingCover}
                />
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => document.getElementById('cover-upload-input')?.click()}
                  disabled={isUploadingCover}
                >
                  {isUploadingCover ? 'Uploading...' : 'Change Cover'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Course Content
              </CardTitle>
              <CardDescription>
                {course.sections.length} section{course.sections.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="content">Content Structure</TabsTrigger>
                  <TabsTrigger value="preview">Preview Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
                    <div className="space-y-6">
                      {course.sections.map((section, sectionIndex) => (
                        <div key={section.id} className="space-y-3">
                          <h3 className="text-md font-medium">
                            {sectionIndex + 1}. {section.title}
                          </h3>
                          
                          <div className="ml-6 space-y-2">
                            {section.blocks.map((block, blockIndex) => (
                              <div key={block.id} className="flex items-start space-x-2 p-2 hover:bg-slate-50 rounded-md">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-blue-600">
                                  {getBlockIcon(block.type)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {sectionIndex + 1}.{blockIndex + 1} {block.title || `${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Content`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                                    {isFileReference(block.content) && `: ${getFilenameFromReference(block.content)}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {sectionIndex < course.sections.length - 1 && (
                            <Separator className="my-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="preview" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
                    <div className="space-y-8">
                      {course.sections.map((section) => (
                        <div key={section.id} className="space-y-4">
                          <h2 className="text-xl font-bold border-b pb-2">{section.title}</h2>
                          
                          <div className="space-y-6">
                            {section.blocks.map((block) => (
                              <div key={block.id} className="space-y-2">
                                {block.title && (
                                  <h3 className="text-lg font-semibold">{block.title}</h3>
                                )}
                                
                                {block.type === 'text' && (
                                  <div className="prose max-w-none">
                                    <p>{block.content}</p>
                                  </div>
                                )}
                                
                                {block.type === 'image' && (
                                  <div className="border rounded-md p-4">
                                    {block.fileUrl ? (
                                      <div className="flex flex-col items-center">
                                        <img 
                                          src={block.fileUrl} 
                                          alt={block.title || 'Course image'}
                                          className="max-w-full max-h-[400px] rounded-md object-contain"
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                          {block.title || 'Image'}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center space-y-2 p-6">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                          <ImageIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          Image not available
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {block.type === 'video' && (
                                  <div className="border rounded-md p-4">
                                    {block.fileUrl ? (
                                      <div className="flex flex-col items-center">
                                        <video 
                                          src={block.fileUrl} 
                                          controls
                                          className="max-w-full max-h-[400px] rounded-md"
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                          {block.title || 'Video'}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center space-y-2 p-6">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                          <Video className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          Video not available
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {block.type === 'pdf' && (
                                  <div className="border rounded-md p-4">
                                    {block.fileUrl ? (
                                      <div className="flex flex-col items-center">
                                        <object
                                          data={block.fileUrl}
                                          type="application/pdf"
                                          width="100%"
                                          height="500px"
                                          className="rounded-md border"
                                        >
                                          <p>Your browser does not support PDFs. 
                                            <a href={block.fileUrl} download={block.title || 'PDF'}>Download the PDF</a>
                                          </p>
                                        </object>
                                        <p className="text-sm text-gray-500 mt-2">
                                          {block.title || 'PDF'}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center space-y-2 p-6">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                          <FileText className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          PDF not available
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPathSelector} onOpenChange={setShowPathSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Path for {course.title}</DialogTitle>
          </DialogHeader>
          <AdminPathSelector
            course={course}
            onSuccess={() => {
              setShowPathSelector(false);
              // Reload course data to reflect new path
              window.location.reload();
            }}
            onCancel={() => setShowPathSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetailsPage;
