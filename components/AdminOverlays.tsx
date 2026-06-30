import React from 'react';
import { Edit3, LogOut, X } from 'lucide-react';
import type { ManagedImageItem } from '../types';

interface AdminOverlaysProps {
  isEditMode: boolean;
  onExitEditMode: () => void;
  adminAccessOpen: boolean;
  adminAccessValue: string;
  onAdminAccessValueChange: (value: string) => void;
  onCloseAdminAccess: () => void;
  onSubmitAdminAccess: (event: React.FormEvent<HTMLFormElement>) => void;
  groupEditorOpen: boolean;
  groupEditorValue: string;
  groupEditorError: string;
  groupEditorNotice: string;
  onGroupEditorValueChange: (value: string) => void;
  onClearGroupEditorFeedback: () => void;
  onCloseGroupEditor: () => void;
  onSubmitGroupNumber: (event: React.FormEvent<HTMLFormElement>) => void;
  imageDeleteTarget: ManagedImageItem | null;
  onCancelDeleteImage: () => void;
  onConfirmDeleteImage: () => void;
}

const AdminOverlays: React.FC<AdminOverlaysProps> = ({
  isEditMode,
  onExitEditMode,
  adminAccessOpen,
  adminAccessValue,
  onAdminAccessValueChange,
  onCloseAdminAccess,
  onSubmitAdminAccess,
  groupEditorOpen,
  groupEditorValue,
  groupEditorError,
  groupEditorNotice,
  onGroupEditorValueChange,
  onClearGroupEditorFeedback,
  onCloseGroupEditor,
  onSubmitGroupNumber,
  imageDeleteTarget,
  onCancelDeleteImage,
  onConfirmDeleteImage
}) => {
  return (
    <>
      {isEditMode && (
        <div className="fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 border border-[#c8322a]/70 bg-black/82 px-4 py-3 text-white shadow-[0_18px_45px_rgb(0_0_0/0.42)] backdrop-blur-md">
          <span className="flex items-center gap-2 text-xs font-black tracking-[0.16em] text-[#c8322a]">
            <Edit3 className="h-4 w-4" />
            编辑模式
          </span>
          <button
            type="button"
            onClick={onExitEditMode}
            className="flex items-center gap-2 bg-[#c8322a] px-3 py-2 text-xs font-black tracking-[0.12em] text-white transition hover:bg-white hover:text-[#c8322a]"
          >
            <LogOut className="h-4 w-4" />
            退出
          </button>
        </div>
      )}

      {adminAccessOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/72 px-5 backdrop-blur-md">
          <form onSubmit={onSubmitAdminAccess} autoComplete="off" className="w-full max-w-md border border-[#c8322a]/55 bg-[#0b0b0b] p-6 text-white shadow-[18px_18px_0_rgb(0_0_0/0.35)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-black tracking-[0.32em] text-[#c8322a]">SUNFLOWER ACCESS</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">诶，这里有朵向日葵</h2>
              </div>
              <button
                type="button"
                onClick={onCloseAdminAccess}
                className="p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 border border-white/12 bg-black/45 p-3">
              <input
                autoFocus
                type="text"
                name="sunflower-message"
                autoComplete="off"
                spellCheck={false}
                value={adminAccessValue}
                onChange={(event) => onAdminAccessValueChange(event.target.value)}
                placeholder="要对向日葵说些什么？"
                className="w-full bg-transparent font-mono text-xl font-black tracking-[0.12em] text-white outline-none placeholder:text-white/25"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCloseAdminAccess}
                className="border border-white/18 px-5 py-3 text-sm font-black text-white/62 transition hover:border-white/40 hover:text-white"
              >
                取消
              </button>
              <button type="submit" className="bg-[#c8322a] px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#c8322a]">
                确认
              </button>
            </div>
          </form>
        </div>
      )}

      {groupEditorOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/72 px-5 backdrop-blur-md">
          <form onSubmit={onSubmitGroupNumber} className="w-full max-w-md border border-[#c8322a]/55 bg-[#0b0b0b] p-6 text-white shadow-[18px_18px_0_rgb(0_0_0/0.35)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-black tracking-[0.32em] text-[#c8322a]">QQ GROUP</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">修改大群群号</h2>
              </div>
              <button
                type="button"
                onClick={onCloseGroupEditor}
                className="p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mt-6 block text-[11px] font-black tracking-[0.22em] text-white/42">MAIN GROUP NUMBER</label>
            <div className="mt-2 border border-white/12 bg-black/45 p-3">
              <input
                autoFocus
                type="text"
                value={groupEditorValue}
                onChange={(event) => {
                  onGroupEditorValueChange(event.target.value);
                  onClearGroupEditorFeedback();
                }}
                className="w-full bg-transparent font-mono text-2xl font-black tracking-[0.1em] text-white outline-none placeholder:text-white/25"
              />
            </div>
            {groupEditorError && (
              <p className="mt-3 border border-[#c8322a]/45 bg-[#c8322a]/12 px-3 py-2 text-sm font-bold text-white/78">
                {groupEditorError}
              </p>
            )}
            {groupEditorNotice && (
              <p className="mt-3 border border-white/14 bg-white/[0.06] px-3 py-2 text-sm font-bold text-white/62">
                {groupEditorNotice}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCloseGroupEditor}
                className="border border-white/18 px-5 py-3 text-sm font-black text-white/62 transition hover:border-white/40 hover:text-white"
              >
                取消
              </button>
              <button type="submit" className="bg-[#c8322a] px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#c8322a]">
                保存群号
              </button>
            </div>
          </form>
        </div>
      )}

      {imageDeleteTarget && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/72 px-5 backdrop-blur-md">
          <div className="w-full max-w-md border border-[#c8322a]/55 bg-[#0b0b0b] p-6 text-white shadow-[18px_18px_0_rgb(0_0_0/0.35)]">
            <p className="text-[10px] font-black tracking-[0.32em] text-[#c8322a]">DELETE IMAGE</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">删除图片</h2>
            <p className="mt-4 text-sm font-bold leading-relaxed text-white/58">
              确定要删除「{imageDeleteTarget.title}」吗？这个操作会从当前列表中移除它。
            </p>
            <div className="mt-5 overflow-hidden border border-white/12 bg-black">
              <img src={imageDeleteTarget.imageUrl} alt={imageDeleteTarget.title} className="h-36 w-full object-cover opacity-75" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancelDeleteImage}
                className="border border-white/18 px-5 py-3 text-sm font-black text-white/62 transition hover:border-white/40 hover:text-white"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirmDeleteImage}
                className="bg-[#c8322a] px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#c8322a]"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOverlays;
