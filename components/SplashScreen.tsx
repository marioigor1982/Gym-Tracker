import React, { useState, useEffect } from 'react';
import { DumbbellIcon } from './icons';

interface SplashScreenProps {
  onEnter: () => void;
}

const wallpapers = [
  'https://images.unsplash.com/photo-1623874514711-0f321325f318?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YWNhZGVtaWF8ZW58MHx8MHx8fDA=&fm=jpg&q=60&w=3000',
  'https://assets-cdn.wellhub.com/images/?su=https://images.partners.gympass.com/image/partners/0f3087f7-e147-40ec-af23-8a605ec1b263/lg_f795cf52-e518-4555-99f5-0cf83f9129d1_WhatsAppImage20230822at10.39.28.jpeg&h=280',
  'https://cdn.pixabay.com/photo/2016/03/27/23/00/weight-lifting-1284616_640.jpg',
  'https://media.istockphoto.com/id/2202976374/pt/foto/modern-gym-with-exercise-machines.webp?a=1&b=1&s=612x612&w=0&k=20&c=kxyJqlUN5yDOOGiWUcr491JcTVJEE3mS8y0sf2p3p9E=',
  'https://cdn.gazetasp.com.br/img/pc/825/560/dn_arquivo/2024/08/novo-projeto-3_1.jpg',
  'https://img.freepik.com/fotos-premium/close-up-dos-equipamentos-na-academia-de-treinamento_180547-3310.jpg?semt=ais_hybrid&w=740'
];


const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [currentWallpaperIndex, setCurrentWallpaperIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWallpaperIndex((prevIndex) => (prevIndex + 1) % wallpapers.length);
    }, 5000); // 5 seconds

    return () => clearInterval(timer);
  }, []);

  const textShadowStyle = { textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' };

  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Background Images Container */}
      {wallpapers.map((url, index) => (
        <div
          key={url}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            index === currentWallpaperIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${url}')` }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-70"></div>

      {/* Content */}
      <div className="relative z-10 text-center animate-fade-in-up p-4">
        <div className="flex justify-center items-center gap-4 mb-4">
          <DumbbellIcon className="h-12 w-12 md:h-16 md:w-16 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight" style={textShadowStyle}>Gym Tracker</h1>
        </div>
        <p className="text-lg md:text-xl text-gray-300 mb-8" style={textShadowStyle}>Sua jornada para a força começa aqui.</p>
        <button
          onClick={onEnter}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105"
        >
          Painel de Treino
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
