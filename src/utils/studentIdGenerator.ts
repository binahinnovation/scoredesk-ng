import { supabase } from '@/integrations/supabase/client';

export interface GenerateStudentIdOptions {
  schoolId?: string;
  maxAttempts?: number;
}

export const generateStudentId = async (options: GenerateStudentIdOptions = {}): Promise<string> => {
  const { schoolId, maxAttempts = 10 } = options;
  
  try {
    // Get school information for prefix
    let prefix = 'school';
    
    if (schoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('alias, name')
        .eq('id', schoolId)
        .single();
      
      if (school) {
        // Use alias if available, otherwise create from school name (first 3 letters)
        prefix = school.alias || 
                 school.name.toLowerCase()
                           .replace(/[^a-z0-9]/g, '') // Remove special characters
                           .substring(0, 3); // Limit to 3 letters
      }
    } else {
      // Try to get current user's school from profile first
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, school_name')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (profile?.school_name) {
        // Use school_name from profile (prioritize this) - only first 3 letters
        prefix = profile.school_name.toLowerCase()
                                   .replace(/[^a-z0-9]/g, '')
                                   .substring(0, 3);
      } else if (profile?.school_id) {
        const { data: school } = await supabase
          .from('schools')
          .select('alias, name')
          .eq('id', profile.school_id)
          .single();
        
        if (school) {
          prefix = school.alias || 
                   school.name.toLowerCase()
                             .replace(/[^a-z0-9]/g, '')
                             .substring(0, 3);
        }
      }
    }
    
    // Generate unique ID with retries
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate 5-digit random number
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const studentId = `${prefix}-${randomNum}`;
      
      // Check if ID already exists
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();
      
      if (!existing) {
        return studentId;
      }
      
      console.log(`Attempt ${attempt + 1}: ID ${studentId} already exists, retrying...`);
    }
    
    throw new Error(`Failed to generate unique student ID after ${maxAttempts} attempts`);
  } catch (error) {
    console.error('Error generating student ID:', error);
    throw error;
  }
};

export const validateStudentId = (studentId: string): { isValid: boolean; message?: string } => {
  if (!studentId || studentId.trim().length === 0) {
    return { isValid: false, message: 'Student ID is required' };
  }
  
  const trimmed = studentId.trim();
  
  // Allow both old format (just numbers) and new format (prefix-number)
  const oldFormatRegex = /^\d+$/; // Just numbers
  const newFormatRegex = /^[a-zA-Z0-9]+-\d{5}$/; // prefix-number
  
  if (!oldFormatRegex.test(trimmed) && !newFormatRegex.test(trimmed)) {
    return { 
      isValid: false, 
      message: 'Student ID should be in format: prefix-12345 (5 digits) or just numbers for legacy IDs' 
    };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, message: 'Student ID is too long (max 50 characters)' };
  }
  
  return { isValid: true };
};
