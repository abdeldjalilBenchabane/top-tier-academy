import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StreamingInternal from './StreamingInternal'; // 👈 Composant séparé (à créer juste après)

const Streaming = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="py-8 text-center text-white">Chargement de l'utilisateur...</div>;
  }

  if (!user) {
    return <div className="py-8 text-center text-red-400">Utilisateur non authentifié. Veuillez vous reconnecter.</div>;
  }

  if (!user.id || typeof user.id !== 'string' || user.id.trim() === '' || user.id === 'undefined') {
    return <div className="py-8 text-center text-red-400">ID utilisateur manquant ou invalide.</div>;
  }

  if (!user.agoraRtmToken) {
    return <div className="py-8 text-center text-red-400">Jeton Agora RTM manquant. Veuillez actualiser ou vous reconnecter.</div>;
  }

  return <StreamingInternal id={id as string} user={user} navigate={navigate} />;
};

export default Streaming;
