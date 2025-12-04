import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarGenerator, generateAgentAvatar, type AvatarStyle } from '@/components/avatar-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';

export function CreateAgentPage() {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentAvatar, setAgentAvatar] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('avataaars');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAvatar = (dataUri: string) => {
    setAgentAvatar(dataUri);
  };

  const handleGenerateRandomAvatar = () => {
    const randomSeed = `${agentName || 'agent'}_${Date.now()}_${Math.random()}`;
    const avatar = generateAgentAvatar(randomSeed, selectedStyle);
    setAgentAvatar(avatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) {
      alert('Пожалуйста, введите имя агента');
      return;
    }

    setIsGenerating(true);

    try {
      // Here you would normally send the agent data to your backend
      console.log('Creating agent:', {
        name: agentName,
        description: agentDescription,
        avatar: agentAvatar,
        style: selectedStyle,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`Агент "${agentName}" успешно создан!`);
      navigate('/');
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Ошибка при создании агента');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к агентам
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Создать нового агента</h1>
        <p className="text-muted-foreground mt-2">
          Создайте уникального AI-агента с персонализированным аватаром
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Аватар агента
              </CardTitle>
              <CardDescription>
                Выберите стиль и создайте уникальный аватар для вашего агента
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <AvatarGenerator
                  seed={agentName || 'new-agent'}
                  style={selectedStyle}
                  size={250}
                  onAvatarGenerated={handleGenerateAvatar}
                  showControls={true}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateRandomAvatar}
                className="w-full"
              >
                Случайный аватар
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Аватар автоматически обновляется при изменении имени агента
              </p>
            </CardFooter>
          </Card>

          {/* Agent Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Детали агента</CardTitle>
              <CardDescription>
                Укажите основную информацию о вашем агенте
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="agent-name">Имя агента *</Label>
                <Input
                  id="agent-name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Например: VIBEE Assistant"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="agent-description">Описание</Label>
                <Textarea
                  id="agent-description"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  placeholder="Опишите назначение и возможности агента..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label>Стиль аватара</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('avataaars')}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      selectedStyle === 'avataaars'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Аватары
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('human')}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      selectedStyle === 'human'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Люди
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('initials')}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      selectedStyle === 'initials'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Инициалы
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating || !agentName.trim()}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Создание агента...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Создать агента
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
