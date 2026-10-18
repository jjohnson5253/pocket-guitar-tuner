import sharp from 'sharp';
await sharp(new URL('../assets/icon.svg', import.meta.url).pathname).flatten({ background: '#111b18' }).png().toFile(new URL('../assets/icon.png', import.meta.url).pathname);
