import { useEffect, useRef, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Camera as CameraIcon, ImagePlus, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractAppointmentPhoto, type PhotoDraft } from '@/lib/appointmentPhoto';
import { toast } from 'sonner';

export function AppointmentPhotoImport({ onDraft }: { onDraft: (draft: PhotoDraft) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController>();
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  useEffect(() => () => abort.current?.abort(), []);
  const readImage = async (image: string) => {
    setBusy(true); abort.current = new AbortController();
    try { onDraft(await extractAppointmentPhoto(image, abort.current.signal)); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) toast.error(error instanceof Error ? error.message : 'לא ניתן לקרוא את ההזמנה'); }
    finally { setBusy(false); }
  };
  const camera = async () => {
    if (!Capacitor.isNativePlatform()) { input.current?.click(); return; }
    try {
      const photo = await Camera.getPhoto({ source: CameraSource.Camera, resultType: CameraResultType.DataUrl, quality: 85, width: 1600, correctOrientation: true, saveToGallery: false });
      if (photo.dataUrl) await readImage(photo.dataUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!/cancel/i.test(message)) toast.error('לא ניתן לפתוח מצלמה. בדקי את הרשאת המצלמה בהגדרות האייפון.');
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('בחרי תמונת JPG או PNG.'); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error('התמונה גדולה מדי. צלמי מחדש או בחרי תמונה קטנה יותר.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') void readImage(reader.result); };
    reader.readAsDataURL(file);
  };
  return <section className="space-y-3 border-b pb-5">
    {!consent ? <>
      <p className="text-base text-muted-foreground">קריאת הזמנה מצילום שולחת את התמונה ל־Lovable AI. ייתכן שיש בה מידע רפואי אישי. התמונה אינה נשמרת במערכת; בדקי את הפרטים לפני שמירה.</p>
      <Button type="button" variant="outline" className="w-full h-14 text-lg" onClick={() => setConsent(true)}><CameraIcon className="ml-2 h-5 w-5" />מאשרת קריאה מצילום</Button>
    </> : busy ? <div className="flex items-center justify-between gap-3" role="status"><span>קוראת את ההזמנה...</span><Button type="button" variant="outline" onClick={() => abort.current?.abort()}><Square className="ml-2 h-4 w-4" />עצרי</Button></div> : <div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline" className="flex-1 h-14 text-lg" onClick={() => void camera()}><CameraIcon className="ml-2 h-5 w-5" />צילום הזמנה</Button>
      <Button type="button" variant="outline" className="flex-1 h-14 text-lg" onClick={() => input.current?.click()}><ImagePlus className="ml-2 h-5 w-5" />בחירת תמונה</Button>
    </div>}
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="תמונת הזמנה לתור" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
  </section>;
}