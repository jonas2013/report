import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface Props {
  onSuccess: (token: string) => void;
}

interface PuzzleData {
  bgImage: string;
  sliderImage: string;
  captchaId: string;
  sliderY: number;
}

const SLIDER_WIDTH = 300;

export function SliderCaptcha({ onSuccess }: Props) {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [sliderX, setSliderX] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'fail'>('idle');
  const [failCount, setFailCount] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setStatus('idle');
    setSliderX(0);
    try {
      const { data } = await api.get('/captcha/puzzle');
      setPuzzle(data.data);
    } catch {
      setStatus('fail');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handleDragStart = (clientX: number) => {
    if (status === 'success' || !puzzle) return;
    setDragging(true);
    startXRef.current = clientX;
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragging || !trackRef.current) return;
    const diff = clientX - startXRef.current;
    const maxX = SLIDER_WIDTH - 44;
    const x = Math.max(0, Math.min(diff, maxX));
    setSliderX(x);
  }, [dragging]);

  const handleDragEnd = useCallback(async () => {
    if (!dragging || !puzzle) return;
    setDragging(false);

    try {
      const { data } = await api.post('/captcha/verify', {
        captchaId: puzzle.captchaId,
        x: Math.round(sliderX),
      });
      if (data.success) {
        setStatus('success');
        onSuccess(data.data.token);
      }
    } catch {
      setStatus('fail');
      setFailCount((c) => {
        const next = c + 1;
        if (next >= 3) {
          setTimeout(fetchPuzzle, 800);
          return 0;
        }
        return next;
      });
      setTimeout(() => setStatus('idle'), 400);
      setSliderX(0);
    }
  }, [dragging, puzzle, sliderX, onSuccess, fetchPuzzle]);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (!dragging) return;
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);
    const onTouchEnd = () => handleDragEnd();
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  if (loading || !puzzle) {
    return (
      <div className="w-[300px] h-[190px] flex items-center justify-center bg-surface-container rounded-lg border border-outline-variant">
        <span className="text-on-surface-variant text-sm">加载中...</span>
      </div>
    );
  }

  const statusBorder = status === 'success'
    ? 'border-green-600 captcha-success'
    : status === 'fail'
    ? 'border-red-600 captcha-shake'
    : 'border-outline-variant';

  return (
    <div className={`w-[300px] rounded-lg border-2 ${statusBorder} overflow-hidden bg-surface-container-lowest`}>
      <div className="relative w-[300px] h-[150px] select-none">
        <img src={puzzle.bgImage} alt="" className="w-full h-full" draggable={false} />
        <img
          src={puzzle.sliderImage}
          alt=""
          className="absolute top-0 left-0"
          style={{
            transform: `translate(${sliderX}px, ${puzzle.sliderY - 8}px)`,
            height: 60,
            width: 60,
          }}
          draggable={false}
        />
        <button
          type="button"
          onClick={fetchPuzzle}
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/30 rounded text-white hover:bg-black/50"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>

      <div
        ref={trackRef}
        className="relative h-[40px] bg-surface-container flex items-center px-2"
      >
        <div
          className="absolute left-0 top-0 h-full bg-primary/20 rounded-l"
          style={{ width: sliderX + 10 }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant pointer-events-none select-none">
          {status === 'success' ? '验证成功' : '向右拖动滑块完成验证'}
        </span>
        <div
          className="relative z-10 w-10 h-8 bg-primary rounded flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm select-none"
          style={{ transform: `translateX(${sliderX}px)` }}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        >
          <span className="material-symbols-outlined text-on-primary text-sm">
            {status === 'success' ? 'check' : 'chevron_right'}
          </span>
        </div>
      </div>
    </div>
  );
}
