-- Sequence for certificate numbers (must be created before being referenced)
CREATE SEQUENCE IF NOT EXISTS cert_seq;

-- Student profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_pct INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lms_lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ,
  video_progress_seconds INT DEFAULT 0,
  quiz_passed BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, lesson_id)
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_number TEXT UNIQUE DEFAULT 'CERT-' || to_char(NOW(), 'YYYYMM') || '-' || lpad(nextval('cert_seq')::TEXT, 5, '0'),
  verification_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  UNIQUE(student_id, course_id)
);

-- Quiz attempts (for tracking)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES lms_quizzes(id) ON DELETE CASCADE NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_profiles
CREATE POLICY "select_own_profile" ON student_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON student_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for student_enrollments
CREATE POLICY "select_own_enrollments" ON student_enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "insert_own_enrollments" ON student_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "update_own_enrollments" ON student_enrollments FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- RLS Policies for lesson_progress
CREATE POLICY "select_own_progress" ON lesson_progress FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "insert_own_progress" ON lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "update_own_progress" ON lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- RLS Policies for cart_items
CREATE POLICY "select_own_cart" ON cart_items FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "insert_own_cart" ON cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "delete_own_cart" ON cart_items FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- RLS Policies for certificates
CREATE POLICY "select_own_certificates" ON certificates FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- RLS Policies for quiz_attempts
CREATE POLICY "select_own_attempts" ON quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "insert_own_attempts" ON quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Function to create student profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.student_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating student profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON student_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_cart_student ON cart_items(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);