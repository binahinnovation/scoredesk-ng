import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Editor } from '@tinymce/tinymce-react';
import { useReactToPrint } from 'react-to-print';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Type, 
  Printer, 
  Eye,
  Download,
  Plus,
  Trash2,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  marks: number;
  question_type: 'objective' | 'theory' | 'practical' | 'multiple_choice';
  options?: string[];
  correct_answer?: string;
}

interface DocumentSettings {
  headerText: string;
  footerText: string;
  includeSchoolLogo: boolean;
  fontSize: number;
  lineSpacing: number;
  marginSize: number;
}

interface RichQuestionEditorProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  title: string;
  subjectName: string;
  className: string;
  termName: string;
}

export function RichQuestionEditor({ 
  questions, 
  onQuestionsChange, 
  title, 
  subjectName, 
  className, 
  termName 
}: RichQuestionEditorProps) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>({
    headerText: `${title} - ${subjectName}`,
    footerText: `${className} • ${termName}`,
    includeSchoolLogo: true,
    fontSize: 12,
    lineSpacing: 1.5,
    marginSize: 20
  });
  
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const addQuestion = (type: Question['question_type'] = 'theory') => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      marks: 1,
      question_type: type,
      ...(type === 'multiple_choice' && {
        options: ['', '', '', ''],
        correct_answer: ''
      })
    };
    onQuestionsChange([...questions, newQuestion]);
    setActiveQuestionId(newQuestion.id);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    const updatedQuestions = questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    );
    onQuestionsChange(updatedQuestions);
  };

  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter(q => q.id !== id));
    if (activeQuestionId === id) {
      setActiveQuestionId(null);
    }
  };

  const duplicateQuestion = (id: string) => {
    const questionToDuplicate = questions.find(q => q.id === id);
    if (questionToDuplicate) {
      const newQuestion = {
        ...questionToDuplicate,
        id: Date.now().toString(),
        question_text: questionToDuplicate.question_text + ' (Copy)'
      };
      onQuestionsChange([...questions, newQuestion]);
    }
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    const newQuestions = [...questions];
    [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];
    onQuestionsChange(newQuestions);
  };

  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  const PrintableDocument = () => (
    <div 
      ref={printRef}
      style={{ 
        fontSize: `${documentSettings.fontSize}px`,
        lineHeight: documentSettings.lineSpacing,
        margin: `${documentSettings.marginSize}px`,
        fontFamily: 'Arial, sans-serif'
      }}
      className="bg-white p-8 min-h-screen"
    >
      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">{documentSettings.headerText}</h1>
        <p className="text-lg">{documentSettings.footerText}</p>
        <div className="mt-4 text-sm">
          <p><strong>Time Allowed:</strong> _______ Hours</p>
          <p><strong>Total Marks:</strong> {questions.reduce((sum, q) => sum + q.marks, 0)} marks</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">INSTRUCTIONS:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Answer ALL questions</li>
          <li>Write clearly and legibly</li>
          <li>Show all workings where applicable</li>
          <li>Use blue or black ink only</li>
        </ul>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="break-inside-avoid">
            <div className="flex items-start gap-2 mb-2">
              <span className="font-bold">{index + 1}.</span>
              <div className="flex-1">
                <div 
                  dangerouslySetInnerHTML={{ __html: question.question_text || `Question ${index + 1}` }}
                  className="mb-2"
                />
                
                {question.question_type === 'multiple_choice' && question.options && (
                  <div className="ml-4 space-y-1">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="font-medium">{String.fromCharCode(65 + optIndex)})</span>
                        <span>{option || `Option ${String.fromCharCode(65 + optIndex)}`}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-right text-sm text-gray-600 mt-2">
                  [{question.marks} mark{question.marks > 1 ? 's' : ''}]
                </div>
              </div>
            </div>
            
            {/* Answer space */}
            <div className="ml-6 border-t border-gray-300 pt-2">
              <div className="h-20 border-l-2 border-gray-200 pl-4">
                <p className="text-sm text-gray-400 italic">Answer space</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-600">
        <p>END OF EXAMINATION</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={previewMode ? 'preview' : 'edit'} onValueChange={(value) => setPreviewMode(value === 'preview')}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="edit">Edit Questions</TabsTrigger>
            <TabsTrigger value="preview">Document Preview</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Questions ({questions.length})</span>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => addQuestion('theory')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      activeQuestionId === question.id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveQuestionId(question.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Q{index + 1}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {question.marks}m
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(question.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {question.question_text.replace(/<[^>]*>/g, '') || 'New question...'}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {question.question_type}
                    </Badge>
                  </div>
                ))}
                
                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions yet</p>
                    <Button className="mt-2" onClick={() => addQuestion()}>
                      Add First Question
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {activeQuestion ? `Edit Question ${questions.findIndex(q => q.id === activeQuestionId) + 1}` : 'Select a Question'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeQuestion ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Question Type</Label>
                        <Select
                          value={activeQuestion.question_type}
                          onValueChange={(value) => updateQuestion(activeQuestion.id, 'question_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="theory">Theory</SelectItem>
                            <SelectItem value="objective">Objective</SelectItem>
                            <SelectItem value="practical">Practical</SelectItem>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Marks</Label>
                        <Input
                          type="number"
                          min="1"
                          value={activeQuestion.marks}
                          onChange={(e) => updateQuestion(activeQuestion.id, 'marks', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Question Text</Label>
                       <Editor
                         apiKey="4p9rrdmnwohm65wffmzhj0mlmk7gt99cw2c47btmqh5rakzm"
                        value={activeQuestion.question_text}
                        onEditorChange={(content) => updateQuestion(activeQuestion.id, 'question_text', content)}
                        init={{
                          height: 300,
                          menubar: false,
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                          ],
                          toolbar: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                          placeholder: 'Enter your question here...'
                        }}
                      />
                    </div>

                    {activeQuestion.question_type === 'multiple_choice' && (
                      <div>
                        <Label>Answer Options</Label>
                        <div className="space-y-2">
                          {activeQuestion.options?.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="font-medium w-8">{String.fromCharCode(65 + index)})</span>
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(activeQuestion.options || [])];
                                  newOptions[index] = e.target.value;
                                  updateQuestion(activeQuestion.id, 'options', newOptions);
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-2">
                          <Label>Correct Answer</Label>
                          <Select
                            value={activeQuestion.correct_answer}
                            onValueChange={(value) => updateQuestion(activeQuestion.id, 'correct_answer', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeQuestion.options?.map((_, index) => (
                                <SelectItem key={index} value={String.fromCharCode(65 + index)}>
                                  {String.fromCharCode(65 + index)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Type className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a question from the list to start editing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <PrintableDocument />
        </TabsContent>
      </Tabs>
    </div>
  );
}
