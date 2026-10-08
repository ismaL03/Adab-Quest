import { Navigate, useNavigate, useParams } from 'react-router';
import { getLesson, isLessonUnlocked } from '@/data/curriculum';
import { LessonPlayer } from '@/features/lesson/LessonPlayer';
import { useProgress } from '@/store/progress';

export default function LessonPage() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const records = useProgress((s) => s.lessons);
  const lesson = getLesson(lessonId);

  // Leçon inconnue ou encore verrouillée : retour à la carte.
  if (!lesson || !isLessonUnlocked(lesson.id, (id) => !!records[id])) return <Navigate to="/" replace />;

  return <LessonPlayer lesson={lesson} onExit={() => navigate('/')} />;
}
