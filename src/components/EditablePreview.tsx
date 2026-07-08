import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Save, Type, Image, RotateCcw, Eye, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';

interface Question {
  id: string;
  question_text: string;
  marks: number;
  question_type: 'objective' | 'theory' | 'practical' | 'multiple_choice';
  options?: string[];
  correct_answer?: string;
}

interface EditablePreviewProps {
  questions: Question[];
  title: string;
  subjectName: string;
  className: string;
  termName: string;
  schoolName?: string;
  onUpdate?: (data: any) => void;
}

interface WatermarkSettings {
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'center' | 'diagonal' | 'top-right' | 'bottom-left';
  rotation: number;
  fontSize: number;
}

interface DocumentSettings {
  examDuration: string;
  instructions: string[];
  footer: string;
  headerTitle: string;
  watermark: WatermarkSettings;
}

export const EditablePreview: React.FC<EditablePreviewProps> = ({
  questions,
  title,
  subjectName,
  className,
  termName,
  schoolName = 'Global Science Academy',
  onUpdate
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };
  const [settings, setSettings] = useState<DocumentSettings>({
    examDuration: '2 Hours',
    instructions: [
      'Answer all questions',
      'Write clearly and legibly',
      'Show all workings where applicable',
      'Time allowed: 2 hours'
    ],
    footer: 'Best of Luck!',
    headerTitle: title || 'Question Paper',
    watermark: {
      enabled: false,
      text: schoolName || 'Global Science Academy',
      opacity: 20,
      position: 'diagonal',
      rotation: -45,
      fontSize: 48
    }
  });

  const previewRef = useRef<HTMLDivElement>(null);

  const handleSettingsChange = (key: keyof DocumentSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdate?.(newSettings);
  };

  const handleWatermarkChange = (key: keyof WatermarkSettings, value: any) => {
    const newWatermark = { ...settings.watermark, [key]: value };
    const newSettings = { ...settings, watermark: newWatermark };
    setSettings(newSettings);
    onUpdate?.(newSettings);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...settings.instructions];
    newInstructions[index] = value;
    handleSettingsChange('instructions', newInstructions);
  };

  const addInstruction = () => {
    const newInstructions = [...settings.instructions, 'New instruction'];
    handleSettingsChange('instructions', newInstructions);
  };

  const removeInstruction = (index: number) => {
    const newInstructions = settings.instructions.filter((_, i) => i !== index);
    handleSettingsChange('instructions', newInstructions);
  };

  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    let yPos = 25;

    // Add watermark if enabled
    if (settings.watermark.enabled) {
      pdf.setTextColor(128, 128, 128, settings.watermark.opacity / 100);
      pdf.setFontSize(settings.watermark.fontSize);
      
      const textWidth = pdf.getTextWidth(settings.watermark.text);
      let x = pageWidth / 2;
      let y = pageHeight / 2;
      
      switch (settings.watermark.position) {
        case 'top-right':
          x = pageWidth - 30;
          y = 50;
          break;
        case 'bottom-left':
          x = 30;
          y = pageHeight - 50;
          break;
        case 'center':
          break;
        case 'diagonal':
          break;
      }
      
      pdf.text(settings.watermark.text, x, y, {
        align: 'center',
        angle: settings.watermark.rotation
      });
    }

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Header
    pdf.setFontSize(18);
    pdf.text(schoolName || 'Global Science Academy', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    pdf.setFontSize(16);
    pdf.text(settings.headerTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Subject details
    pdf.setFontSize(12);
    pdf.text(`Subject: ${subjectName}`, 20, yPos);
    pdf.text(`Duration: ${settings.examDuration}`, pageWidth - 70, yPos);
    yPos += 8;
    pdf.text(`Class: ${className}`, 20, yPos);
    pdf.text(`Term: ${termName}`, pageWidth - 70, yPos);
    yPos += 15;

    // Instructions
    pdf.setFontSize(11);
    pdf.text('Instructions:', 20, yPos);
    yPos += 8;
    
    settings.instructions.forEach(instruction => {
      pdf.text(`• ${instruction}`, 25, yPos);
      yPos += 6;
    });
    yPos += 10;

    // Questions
    questions.forEach((question, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 25;
      }
      
      pdf.setFontSize(11);
      pdf.text(`${index + 1}.`, 20, yPos);
      
      const cleanText = stripHtmlTags(question.question_text);
      const lines = pdf.splitTextToSize(cleanText, 170);
      pdf.text(lines, 30, yPos);
      yPos += lines.length * 6;
      
      pdf.setFontSize(9);
      pdf.text(`[${question.marks} mark${question.marks > 1 ? 's' : ''} - ${question.question_type}]`, 30, yPos);
      yPos += 15;
    });

    // Footer
    if (settings.footer) {
      pdf.setFontSize(10);
      pdf.text(settings.footer, pageWidth / 2, pageHeight - 20, { align: 'center' });
    }

    return pdf.output('blob');
  };

  const downloadPDF = async () => {
    try {
      const pdfBlob = await generatePDF();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${settings.headerTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const getWatermarkStyle = (): React.CSSProperties => {
    if (!settings.watermark.enabled) return { display: 'none' };

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      color: `rgba(128, 128, 128, ${settings.watermark.opacity / 100})`,
      fontSize: `${settings.watermark.fontSize}px`,
      fontWeight: 'bold',
      pointerEvents: 'none',
      transform: `rotate(${settings.watermark.rotation}deg)`,
      zIndex: 1,
      userSelect: 'none'
    };

    switch (settings.watermark.position) {
      case 'center':
        return { ...baseStyle, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${settings.watermark.rotation}deg)` };
      case 'diagonal':
        return { ...baseStyle, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${settings.watermark.rotation}deg)` };
      case 'top-right':
        return { ...baseStyle, top: '10%', right: '10%' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '10%', left: '10%' };
      default:
        return baseStyle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant={isEditMode ? "default" : "outline"}
          onClick={() => setIsEditMode(!isEditMode)}
          className="flex items-center gap-2"
        >
          {isEditMode ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          {isEditMode ? 'Save Preview' : 'Edit Preview'}
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPDF} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Edit Panel */}
      {isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Document Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headerTitle">Document Title</Label>
                <Input
                  id="headerTitle"
                  value={settings.headerTitle}
                  onChange={(e) => handleSettingsChange('headerTitle', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="examDuration">Exam Duration</Label>
                <Input
                  id="examDuration"
                  value={settings.examDuration}
                  onChange={(e) => handleSettingsChange('examDuration', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Instructions</Label>
              <div className="space-y-2">
                {settings.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                      disabled={settings.instructions.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addInstruction}>
                  Add Instruction
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="footer">Footer Text</Label>
              <Input
                id="footer"
                value={settings.footer}
                onChange={(e) => handleSettingsChange('footer', e.target.value)}
              />
            </div>

            {/* Watermark Settings */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="watermarkEnabled"
                  checked={settings.watermark.enabled}
                  onChange={(e) => handleWatermarkChange('enabled', e.target.checked)}
                />
                <Label htmlFor="watermarkEnabled">Enable Watermark</Label>
              </div>

              {settings.watermark.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="watermarkText">Watermark Text</Label>
                    <Input
                      id="watermarkText"
                      value={settings.watermark.text}
                      onChange={(e) => handleWatermarkChange('text', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="watermarkPosition">Position</Label>
                    <Select
                      value={settings.watermark.position}
                      onValueChange={(value) => handleWatermarkChange('position', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="diagonal">Diagonal</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Opacity: {settings.watermark.opacity}%</Label>
                    <Slider
                      value={[settings.watermark.opacity]}
                      onValueChange={(value) => handleWatermarkChange('opacity', value[0])}
                      max={100}
                      min={5}
                      step={5}
                    />
                  </div>

                  <div>
                    <Label>Font Size: {settings.watermark.fontSize}px</Label>
                    <Slider
                      value={[settings.watermark.fontSize]}
                      onValueChange={(value) => handleWatermarkChange('fontSize', value[0])}
                      max={80}
                      min={20}
                      step={4}
                    />
                  </div>

                  <div>
                    <Label>Rotation: {settings.watermark.rotation}°</Label>
                    <Slider
                      value={[settings.watermark.rotation]}
                      onValueChange={(value) => handleWatermarkChange('rotation', value[0])}
                      max={180}
                      min={-180}
                      step={15}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* A4 Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            A4 Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={previewRef}
            className="bg-white shadow-lg mx-auto relative overflow-hidden"
            style={{ 
              width: '210mm', 
              minHeight: '297mm', 
              padding: '20mm',
              fontSize: '11pt',
              lineHeight: '1.4'
            }}
          >
            {/* Watermark */}
            <div style={getWatermarkStyle()}>
              {settings.watermark.text}
            </div>

            {/* Header */}
            <div className="text-center mb-6 relative z-10">
              <h1 className="text-xl font-bold mb-2">{schoolName || 'Global Science Academy'}</h1>
              <h2 className="text-lg font-semibold">{settings.headerTitle}</h2>
            </div>

            {/* Subject Details */}
            <div className="flex justify-between mb-4 text-sm relative z-10">
              <div>
                <p><strong>Subject:</strong> {subjectName}</p>
                <p><strong>Class:</strong> {className}</p>
              </div>
              <div className="text-right">
                <p><strong>Duration:</strong> {settings.examDuration}</p>
                <p><strong>Term:</strong> {termName}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 relative z-10">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {settings.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>

            {/* Questions */}
            <div className="space-y-4 relative z-10">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="mb-2">{stripHtmlTags(question.question_text)}</p>
                      <p className="text-xs text-gray-600">
                        [{question.marks} mark{question.marks > 1 ? 's' : ''} - {question.question_type}]
                      </p>
                      {question.options && question.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <p key={optIndex} className="text-sm">
                              {String.fromCharCode(97 + optIndex)}) {option}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {settings.footer && (
              <div className="text-center mt-8 pt-4 border-t relative z-10">
                <p className="text-sm font-medium">{settings.footer}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
