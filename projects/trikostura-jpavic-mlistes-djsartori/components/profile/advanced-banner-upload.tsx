'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, RotateCw, ZoomIn, ZoomOut, Check, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/crop-image';
import { toast } from 'sonner';
import { compressImage } from '@/lib/image-compression';

interface AdvancedBannerUploadProps {
  currentBannerUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  profileColor: string;
  onRemoveBanner?: () => void;
}

export function AdvancedBannerUpload({
  currentBannerUrl,
  onFileSelect,
  profileColor,
  onRemoveBanner
}: AdvancedBannerUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentBannerUrl || null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileValidation = (selectedFile: File): boolean => {
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Molimo odaberite sliku');
      return false;
    }

    // Validate file size (max 15MB for banner)
    if (selectedFile.size > 15 * 1024 * 1024) {
      toast.error('Slika ne smije biti veća od 15MB');
      return false;
    }

    // Check for valid image formats
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validFormats.includes(selectedFile.type)) {
      toast.error('Podržani formati: JPG, PNG, GIF, WebP');
      return false;
    }

    return true;
  };

  const processImageFile = async (selectedFile: File) => {
    if (!handleFileValidation(selectedFile)) return;

    setIsUploading(true);
    try {
      // Compress image
      const compressedFile = await compressImage(selectedFile, 3);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOriginalImage(result);
        setShowCropper(true);
      };
      reader.readAsDataURL(compressedFile);

      toast.success('Slika učitana! Sada je možete obrezati.');
    } catch (error) {
      toast.error('Greška pri učitavanju slike');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processImageFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processImageFile(droppedFile);
    }
  };

  const handleCropSave = async () => {
    if (!originalImage || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedImage = await getCroppedImg(originalImage, croppedAreaPixels, rotation);

      // Convert blob to file
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const croppedFile = new File([blob], 'banner.jpg', { type: 'image/jpeg' });

      setFile(croppedFile);
      onFileSelect(croppedFile);
      setPreview(croppedImage);
      setShowCropper(false);
      setOriginalImage(null);

      // Reset crop settings
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);

      toast.success('Banner obrezan i spreman za upload!');
    } catch (error) {
      toast.error('Greška pri obrezivanju slike');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setOriginalImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelSelection = () => {
    setPreview(currentBannerUrl || null);
    setFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Promjene odbačene');
  };

  const handleRemovePermanently = () => {
    setPreview(null);
    setFile(null);
    if (onRemoveBanner) {
      onRemoveBanner();
    } else {
      onFileSelect(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Banner uklonjen');
  };

  // Cropper modal
  if (showCropper && originalImage) {
    return (
      <div className="space-y-4">
        <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
          <Cropper
            image={originalImage}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={16 / 9}
            cropShape="rect"
            showGrid={true}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        <div className="space-y-3">
          {/* Zoom Control */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-gray-500" />
          </div>

          {/* Rotation Control */}
          <div className="flex items-center gap-3">
            <RotateCw className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-12">{rotation}°</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleCropSave}
              disabled={isUploading}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              {isUploading ? 'Spremanje...' : 'Spremi'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCrop}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Odustani
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main upload interface
  return (
    <div className="space-y-4">
      {/* Banner Preview */}
      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-lg">
        {preview ? (
          <Image
            src={preview}
            alt="Profile Banner"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${profileColor} 0%, ${profileColor}dd 100%)`,
            }}
          />
        )}
      </div>

      {/* Upload Controls */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="banner-upload"
        />

        {/* Drag and Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <ImageIcon className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isDragging ? (
                <span className="font-semibold text-blue-600">Ispustite banner ovdje</span>
              ) : (
                <>
                  <span className="font-semibold">Klikni za upload</span> ili povuci i ispusti
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP - Max 15MB - Preporučeni omjer 16:9</p>
          </div>
        </div>

        <div className="flex gap-2">
          {file && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelSelection}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Otkaži
            </Button>
          )}

          {(currentBannerUrl || preview) && !file && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePermanently}
              className="text-red-600 hover:text-red-700"
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Ukloni Banner
            </Button>
          )}
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            Obrada slike...
          </div>
        )}
      </div>
    </div>
  );
}
