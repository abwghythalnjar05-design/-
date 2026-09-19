import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { 
  TrendingUp, 
  ArrowDownRight, 
  Receipt, 
  Wallet, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  Eye, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical
} from 'lucide-react';

interface SwipeableTransactionItemProps {
  transaction: Transaction;
  currency?: string;
  isManager: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (txId: string) => void;
  onViewDetails?: (tx: Transaction) => void;
}

export const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({
  transaction,
  currency = 'ريال',
  isManager,
  canEdit = true,
  canDelete = true,
  isOpen,
  onOpen,
  onClose,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  // Maximum swipe reveals the actions (approx 165px for 3 buttons)
  const MAX_SWIPE_PX = 165;
  const SWIPE_THRESHOLD = 35;

  // Sync with parent isOpen state
  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0);
    } else {
      // Snap open to reveal actions on the right side
      setOffsetX(-MAX_SWIPE_PX);
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;

    // Detect if movement is horizontal
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      // Dragging horizontally - prevent vertical page scroll
      const baseOffset = isOpen ? -MAX_SWIPE_PX : 0;
      let newOffset = baseOffset + diffX;

      // Bound between -MAX_SWIPE_PX - 25 and 15 (elastic resistance)
      if (newOffset < -MAX_SWIPE_PX - 25) {
        newOffset = -MAX_SWIPE_PX - 25;
      } else if (newOffset > 15) {
        newOffset = 15;
      }

      setOffsetX(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (isHorizontalSwipeRef.current) {
      // If dragged left past threshold, snap open
      if (offsetX < -SWIPE_THRESHOLD) {
        setOffsetX(-MAX_SWIPE_PX);
        onOpen();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      } else {
        // Snap closed
        setOffsetX(0);
        onClose();
      }
    }
    isHorizontalSwipeRef.current = null;
  };

  // Mouse Drag Support (for testing on desktop / DevTools mobile emulation)
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diffX = e.clientX - startXRef.current;
    const baseOffset = isOpen ? -MAX_SWIPE_PX : 0;
    let newOffset = baseOffset + diffX;

    if (newOffset < -MAX_SWIPE_PX - 25) newOffset = -MAX_SWIPE_PX - 25;
    else if (newOffset > 15) newOffset = 15;

    setOffsetX(newOffset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offsetX < -SWIPE_THRESHOLD) {
      setOffsetX(-MAX_SWIPE_PX);
      onOpen();
    } else {
      setOffsetX(0);
      onClose();
    }
  };

  const isCancelled = transaction.status === 'cancelled';

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'commission':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp className="w-3 h-3" />
            عمولة
          </span>
        );
      case 'withdrawal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ArrowDownRight className="w-3 h-3" />
            سحبة
          </span>
        );
      case 'expense':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Receipt className="w-3 h-3" />
            مصروف
          </span>
        );
      case 'salary':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Wallet className="w-3 h-3" />
            راتب
          </span>
        );
    }
  };

  const getAmountColor = (type: TransactionType) => {
    switch (type) {
      case 'commission':
      case 'salary':
        return 'text-emerald-600';
      case 'withdrawal':
        return 'text-amber-600';
      case 'expense':
        return 'text-rose-600';
    }
  };

  const getAmountPrefix = (type: TransactionType) => {
    switch (type) {
      case 'commission':
      case 'salary':
        return '+';
      case 'withdrawal':
      case 'expense':
        return '-';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs mb-2.5 touch-pan-y select-none">
      {/* Background Action Buttons revealed by Swiping Left */}
      <div 
        className="absolute inset-y-0 right-0 flex items-stretch z-0"
        style={{ width: `${MAX_SWIPE_PX}px` }}
      >
        {/* Quick View Details Button */}
        <button
          id={`swipe-view-${transaction.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(transaction);
            setOffsetX(0);
            onClose();
          }}
          className="flex-1 bg-slate-700 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer"
          title="عرض تفاصيل العملية"
        >
          <Eye className="w-4 h-4" />
          <span className="text-[10px] font-bold">تفاصيل</span>
        </button>

        {/* Quick Edit Button */}
        {canEdit && onEdit && (
          <button
            id={`swipe-edit-${transaction.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction);
              setOffsetX(0);
              onClose();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer"
            title="تعديل العملية"
          >
            <Edit className="w-4 h-4" />
            <span className="text-[10px] font-bold">تعديل</span>
          </button>
        )}

        {/* Quick Delete / Cancel Button */}
        {canDelete && onDelete && (
          <button
            id={`swipe-delete-${transaction.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction.id);
              setOffsetX(0);
              onClose();
            }}
            className={`flex-1 ${
              isCancelled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            } text-white flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer`}
            title={isCancelled ? 'استرجاع العملية' : 'حذف / إلغاء العملية'}
          >
            {isCancelled ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">استرجاع</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">حذف</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Foreground Swipeable Card Body */}
      <div
        id={`tx-swipe-card-${transaction.id}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (isOpen) {
            setOffsetX(0);
            onClose();
          } else {
            onViewDetails?.(transaction);
          }
        }}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 bg-white p-3.5 sm:p-4 rounded-xl cursor-grab active:cursor-grabbing transition-colors ${
          isCancelled ? 'bg-slate-50/75 opacity-75' : 'hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Right Side: Type Badge, Description, and Metadata */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {getTypeBadge(transaction.type)}
              <span className="font-mono text-[10px] text-slate-400 font-semibold">
                #{transaction.id}
              </span>
              {isManager && (
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                  {transaction.employeeName}
                </span>
              )}
              {isCancelled && (
                <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200">
                  ملغاة
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {transaction.description}
            </p>

            {/* Category & Time */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                {transaction.category}
              </span>
              <span>•</span>
              <span className="font-mono">{transaction.date}</span>
              <span>{transaction.time}</span>
              {transaction.source === 'nlp' && (
                <span className="inline-flex items-center gap-0.5 text-teal-600 text-[10px] font-semibold bg-teal-50 px-1 rounded">
                  <Sparkles className="w-2.5 h-2.5" />
                  ذكاء
                </span>
              )}
            </div>
          </div>

          {/* Left Side: Amount and quick swipe prompt */}
          <div className="text-left shrink-0 space-y-1">
            <div
              className={`text-sm sm:text-base font-black font-mono ${
                isCancelled ? 'line-through text-slate-400' : getAmountColor(transaction.type)
              }`}
            >
              {getAmountPrefix(transaction.type)}
              {new Intl.NumberFormat('ar-SA').format(transaction.amount)}{' '}
              <span className="text-xs font-semibold">{currency}</span>
            </div>

            {/* Swipe hint / toggle action */}
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) {
                    setOffsetX(0);
                    onClose();
                  } else {
                    setOffsetX(-MAX_SWIPE_PX);
                    onOpen();
                  }
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition"
                title="إجراءات سريعة"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              <ChevronLeft className="w-3 h-3 opacity-60 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Small swipe affordance line on edge */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-slate-300/80" />
      </div>
    </div>
  );
};
