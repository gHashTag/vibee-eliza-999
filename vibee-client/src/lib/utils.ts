import { AVATAR_IMAGE_MAX_SIZE } from '@/constants';
import type { UUID } from '@elizaos/core';
import { type ClassValue, clsx } from 'clsx';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { twMerge } from 'tailwind-merge';
import type { Agent, UUID as CoreUUID } from '@elizaos/core';
import type { MessageChannel as ClientMessageChannel } from '@/types';
import Avatars from '@dicebear/avatars';
import AvataaarsSprites from '@dicebear/avatars-avataaars-sprites';
import HumanSprites from '@dicebear/avatars-human-sprites';
import InitialsSprites from '@dicebear/avatars-initials-sprites';

/**
 * Combines multiple class names into a single string.
 * * @param {...ClassValue} inputs - Array of class names to be combined.
 * @returns { string } - Combined class names as a single string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

dayjs.extend(localizedFormat);

export const moment = dayjs;

export const formatAgentName = (name: string) => {
  return name.substring(0, 2);
};

/**
 * Converts a character name to a URL-friendly format by replacing spaces with hyphens
 */
/**
 * Converts a character name to a URL-friendly format by replacing spaces with hyphens.
 *
 * @param {string} name - The name of the character to convert.
 * @returns {string} The URL-friendly version of the character name.
 */
export function characterNameToUrl(name: string): string {
  return name.replace(/\s+/g, '-');
}

/**
 * Converts a URL-friendly character name back to its original format by replacing hyphens with spaces
 */
export function urlToCharacterName(urlName: string): string {
  return urlName.replace(/-+/g, ' ');
}

// crypto.randomUUID only works in https context in firefox
export function randomUUID(): UUID {
  return URL.createObjectURL(new Blob()).split('/').pop() as UUID;
}

export function getEntityId(): UUID {
  const USER_ID_KEY = 'elizaos-client-user-id';
  const existingUserId = localStorage.getItem(USER_ID_KEY);

  if (existingUserId) {
    return existingUserId as UUID;
  }

  const newUserId = randomUUID() as UUID;
  localStorage.setItem(USER_ID_KEY, newUserId);

  return newUserId;
}

export const compressImage = (
  file: File,
  maxSize = AVATAR_IMAGE_MAX_SIZE,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.src = e.target.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', quality);

          resolve(resizedBase64);
        };
        img.onerror = reject;
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getAgentAvatar = (
  agent: { id?: UUID; name?: string; settings?: { avatar?: string | null } } | undefined
): string => {
  // Если у агента уже есть аватар - используем его
  if (agent?.settings?.avatar) {
    return agent.settings.avatar;
  }

  // Определяем сид для генерации (ID или имя агента)
  const seed = agent?.id || agent?.name || 'vibee-agent';

  // Создаем детерминированный выбор стиля на основе сида
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  // Выбираем стиль на основе хеша
  const styleIndex = Math.abs(hash) % 3;
  const styles = [AvataaarsSprites, HumanSprites, InitialsSprites];
  const selectedSprites = styles[styleIndex];

  // Генерируем аватар с золотистой цветовой схемой
  const avatars = new Avatars(selectedSprites);

  const options: any = {
    radius: 50,
    width: 200,
    height: 200,
    margin: 10,
  };

  // Золотистая цветовая схема
  options.backgroundColor = ['ffd700', 'ffc700', 'ffb700', 'ffdd55', 'ffe066', 'ffed4a'];

  if (styleIndex === 2) { // Initials
    options.backgroundColors = ['ffd700', 'ffc700', 'ffb700', 'ffdd55', 'ffe066', 'ffed4a'];
    options.fontSize = 80;
  } else if (styleIndex === 0) { // Avataaars
    options.mood = ['happy', 'surprised'];
  } else if (styleIndex === 1) { // Human
    options.mood = ['happy'];
  }

  return avatars.create(seed, options);
};

export const generateGroupName = (
  channel: Partial<ClientMessageChannel> | undefined,
  participants: Partial<Agent>[] | undefined,
  currentUserId: CoreUUID | string | undefined
): string => {
  if (channel?.name && channel.name.trim() !== '') {
    return channel.name;
  }
  if (participants && participants.length > 0) {
    const otherParticipants = participants.filter((p) => p.id !== currentUserId && p.name); // Ensure name exists
    if (
      otherParticipants.length === 0 &&
      participants.some((p) => p.id === currentUserId && p.name)
    ) {
      // If only current user is a participant (and has a name), or no other named participants
      const currentUserParticipant = participants.find((p) => p.id === currentUserId);
      if (currentUserParticipant) return currentUserParticipant.name || 'Unnamed Group';
      return 'Unnamed Group'; // Fallback if current user somehow has no name
    }
    if (otherParticipants.length > 0) {
      return (
        otherParticipants
          .map((p) => p.name)
          .slice(0, 3)
          .join(', ') + (otherParticipants.length > 3 ? '...' : '')
      );
    }
  }
  return 'Unnamed Group';
};
