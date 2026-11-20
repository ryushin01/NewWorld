/** 웹 데모: 공유 창이나 파일 폴더 대신 브라우저 내려받기로 파일을 건넵니다. */
export const downloadOnWeb = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // 내려받기가 시작되기 전에 주소를 풀면 실패하는 브라우저가 있어 잠시 뒤에 풉니다.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
