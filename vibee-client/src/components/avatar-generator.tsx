import { useState, useEffect } from 'react';
import Avatars from '@dicebear/avatars';
import AvataaarsSprites from '@dicebear/avatars-avataaars-sprites';
import HumanSprites from '@dicebear/avatars-human-sprites';
import InitialsSprites from '@dicebear/avatars-initials-sprites';

export type AvatarStyle = 'avataaars' | 'human' | 'initials';

interface AvatarGeneratorProps {
  seed: string;
  style?: AvatarStyle;
  size?: number;
  onAvatarGenerated?: (dataUri: string) => void;
  showControls?: boolean;
  className?: string;
}

export function AvatarGenerator({
  seed,
  style = 'avataaars',
  size = 200,
  onAvatarGenerated,
  showControls = true,
  className = '',
}: AvatarGeneratorProps) {
  const [currentStyle, setCurrentStyle] = useState<AvatarStyle>(style);
  const [avatarDataUri, setAvatarDataUri] = useState<string>('');

  const generateAvatar = (newStyle: AvatarStyle, customSeed?: string) => {
    const seedToUse = customSeed || seed;
    let spriteCollection;

    switch (newStyle) {
      case 'avataaars':
        spriteCollection = AvataaarsSprites;
        break;
      case 'human':
        spriteCollection = HumanSprites;
        break;
      case 'initials':
        spriteCollection = InitialsSprites;
        break;
      default:
        spriteCollection = AvataaarsSprites;
    }

    const avatars = new Avatars(spriteCollection);

    const options: any = {
      radius: 50,
      width: size,
      height: size,
      margin: 10,
    };

    // Style-specific options
    switch (newStyle) {
      case 'avataaars':
        options.mood = ['happy', 'surprised'];
        options.backgroundColor = ['b6e3f4', 'c0aede', 'd1d4f9'];
        break;
      case 'human':
        options.mood = ['happy'];
        break;
      case 'initials':
        options.backgroundColors = ['ffd700', '87ceeb', '98fb98'];
        options.fontSize = 80;
        break;
    }

    const svg = avatars.create(seedToUse, options);
    setAvatarDataUri(svg);

    if (onAvatarGenerated) {
      onAvatarGenerated(svg);
    }
  };

  useEffect(() => {
    generateAvatar(currentStyle, seed);
  }, [seed, currentStyle]);

  const handleStyleChange = (newStyle: AvatarStyle) => {
    setCurrentStyle(newStyle);
  };

  if (!avatarDataUri) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`avatar-generator ${className}`}>
      <div className="avatar-display mb-4">
        <img
          src={avatarDataUri}
          alt={`${currentStyle} avatar`}
          style={{ width: size, height: size }}
          className="rounded-lg border-2 border-border"
        />
      </div>

      {showControls && (
        <div className="avatar-controls space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Стиль аватара:</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleStyleChange('avataaars')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  currentStyle === 'avataaars'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Аватары
              </button>
              <button
                onClick={() => handleStyleChange('human')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  currentStyle === 'human'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Люди
              </button>
              <button
                onClick={() => handleStyleChange('initials')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  currentStyle === 'initials'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Инициалы
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Сид: <span className="font-mono">{seed.substring(0, 8)}...</span>
          </div>

          <button
            onClick={() => generateAvatar(currentStyle)}
            className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Обновить аватар
          </button>
        </div>
      )}
    </div>
  );
}

// Export default utility function for easy avatar generation
export const generateAgentAvatar = (agentName: string, style: AvatarStyle = 'avataaars'): string => {
  const avatars = new Avatars(AvataaarsSprites);
  return avatars.create(agentName, {
    radius: 50,
    width: 400,
    height: 400,
    margin: 10,
    mood: ['happy', 'surprised'],
    backgroundColor: ['ffd700', '87ceeb', 'c0aede'],
  });
};
