/**
 * 후기 첨부용 이미지 압축 (localStorage 용량 제한 대응)
 */
export const compressImageFileForReview = (
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.75, maxBytes = 300000 } = {}
) =>
  new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('이미지 처리에 실패했습니다.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let q = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', q);
        const byteLimit = maxBytes * 1.4;

        while (dataUrl.length > byteLimit && q > 0.35) {
          q = Math.round((q - 0.08) * 100) / 100;
          dataUrl = canvas.toDataURL('image/jpeg', q);
        }

        if (dataUrl.length > byteLimit) {
          reject(
            new Error('이미지 용량이 너무 큽니다. 다른 사진을 선택하거나 해상도가 낮은 사진을 사용해 주세요.')
          );
          return;
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
