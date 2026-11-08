import sharp from 'sharp';
for(const size of [180,192,512])await sharp('public/icons/compass.svg').resize(size,size).png().toFile(`public/icons/compass-${size}.png`);
