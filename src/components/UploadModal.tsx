import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { Button, useToast } from '@toss/tds-mobile';
import { resizeImageDataUrl } from '../lib/image';
import SheetFooter from './SheetFooter';

interface UploadModalProps {
  cellTitle: string;
  cellIcon: string;
  cellId: number;
  boardId: string;
  onClose: () => void;
  onUploadSuccess: (photoUrl: string) => void;
}

// 홈의 "새 빙고 보드 만들기"와 동일하게 TDS BottomSheet(아래에서 위로) 안에서
// 렌더돼요. 제목/딤/드래그 핸들은 시트가 제공하고, 사진을 올리면 바로 등록돼요.
// 하단 '취소'로 명시적으로 닫을 수 있어요.
export default function UploadModal({
  onClose,
  onUploadSuccess
}: UploadModalProps) {
  const { openToast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 등록 완료 타이머는 시트가 등록 도중 닫히면 정리해요(setState-after-unmount·중복 완료 방지).
  useEffect(() => {
    return () => {
      if (completeTimerRef.current != null) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      openToast('사진 파일만 업로드할 수 있어요.');
      return;
    }
    try {
      // 저장 전 다운스케일+압축 (base64 quota/렌더 성능). 실패 시 내부에서 원본 폴백.
      const optimized = await resizeImageDataUrl(file);
      startVerification(optimized);
    } catch (error) {
      console.error('사진 처리 실패:', error);
      openToast('사진을 불러오지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const startVerification = (imageUrl: string) => {
    // 실제 AI 판정/분석은 없어요(사진 인증 = 사용자 자기 등록). 가짜 진행률 대신
    // 짧은 등록 피드백만 보여주고, 이미 리사이즈된 사진을 부모에 넘겨 저장해요.
    setIsVerifying(true);
    completeTimerRef.current = setTimeout(() => {
      completeTimerRef.current = null;
      onUploadSuccess(imageUrl);
    }, 800);
  };

  const cancelVerification = () => {
    if (completeTimerRef.current != null) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    setIsVerifying(false);
    openToast('사진 등록을 취소했어요.');
  };

  return (
    <div>
      <div className="px-6 pt-2 space-y-6">

      {isVerifying ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-60"></div>
            <div className="relative bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles size={28} className="animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-neutral-900">사진을 등록하고 있어요</h4>
            <p className="text-xs text-neutral-500">잠시만 기다려 주세요</p>
          </div>
          <button
            type="button"
            onClick={cancelVerification}
            className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 active:scale-95 transition-all"
          >
            취소
          </button>
        </div>
      ) : (
        <>
          {/* Drag and Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-[20px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[180px] ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 mb-3 shadow-sm">
              <Upload size={22} />
            </div>
            <p className="text-sm font-semibold text-neutral-800">기기에서 사진 업로드</p>
            <p className="text-xs text-neutral-400 mt-1">파일을 마우스로 끌어다 놓거나 클릭하세요</p>
          </div>
        </>
      )}

      </div>

      {/* 취소 — 사진을 올리면 바로 등록되며, 이 버튼으로 시트를 닫아요.
          하단 고정 CTA로 기기 하단과 자연스럽게 이어져요. 인증 중에는 자체 취소를 써요. */}
      {!isVerifying && (
        <SheetFooter>
          <Button color="dark" variant="weak" display="block" size="large" onClick={onClose}>
            취소
          </Button>
        </SheetFooter>
      )}

    </div>
  );
}
