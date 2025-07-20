const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createSmartWhiteBackground() {
    try {
        console.log('🖼️  Creating smart white background (preserving fruits)...');
        
        const image1Path = path.join(__dirname, '../public/images/1F.png');
        const image2Path = path.join(__dirname, '../public/images/2F.png');
        const outputPath = path.join(__dirname, '../public/images/login-bg-smart.jpg');
        
        // Check if source images exist
        if (!fs.existsSync(image1Path) || !fs.existsSync(image2Path)) {
            console.error('❌ Source images not found!');
            return;
        }
        
        // Get image metadata
        const metadata1 = await sharp(image1Path).metadata();
        const metadata2 = await sharp(image2Path).metadata();
        
        console.log(`📏 Image 1 dimensions: ${metadata1.width}x${metadata1.height}`);
        console.log(`📏 Image 2 dimensions: ${metadata2.width}x${metadata2.height}`);
        
        // Create a larger canvas to accommodate both images side by side
        const canvasWidth = Math.max(metadata1.width, metadata2.width) * 2;
        const canvasHeight = Math.max(metadata1.height, metadata2.height);
        
        console.log(`🎨 Creating canvas: ${canvasWidth}x${canvasHeight}`);
        
        // Process image 1: smart background whitening
        const processedImage1 = await sharp(image1Path)
            .resize(metadata1.width, metadata1.height, { fit: 'cover' })
            .modulate({
                brightness: 1.3,    // Moderate brightness increase
                saturation: 1.2,    // Slight saturation increase
                hue: 0             // Keep original hue
            })
            .gamma(1.1)            // Slight gamma adjustment
            .linear(1.1, 0.2)      // Moderate contrast increase
            .toBuffer();
        
        // Process image 2: smart background whitening
        const processedImage2 = await sharp(image2Path)
            .resize(metadata2.width, metadata2.height, { fit: 'cover' })
            .modulate({
                brightness: 1.3,    // Moderate brightness increase
                saturation: 1.2,    // Slight saturation increase
                hue: 0             // Keep original hue
            })
            .gamma(1.1)            // Slight gamma adjustment
            .linear(1.1, 0.2)      // Moderate contrast increase
            .toBuffer();
        
        // Create composite image by placing images side by side
        const composite = await sharp({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        })
        .composite([
            {
                input: processedImage1,
                left: 0,
                top: 0
            },
            {
                input: processedImage2,
                left: metadata1.width,
                top: 0
            }
        ])
        .jpeg({
            quality: 85,        // Good quality
            progressive: true,  // Progressive JPEG for better loading
            mozjpeg: true       // Use mozjpeg for better compression
        })
        .toFile(outputPath);
        
        // Get file size of the new image
        const stats = fs.statSync(outputPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ Smart white background image created successfully!`);
        console.log(`📁 Output: ${outputPath}`);
        console.log(`📊 File size: ${fileSizeInMB} MB`);
        console.log(`🎯 Quality: 85% JPEG with smart background processing`);
        
        // Also create a smaller version for mobile
        const mobileOutputPath = path.join(__dirname, '../public/images/login-bg-smart-mobile.jpg');
        
        await sharp(outputPath)
            .resize(1200, 800, { fit: 'cover' })
            .jpeg({
                quality: 80,
                progressive: true,
                mozjpeg: true
            })
            .toFile(mobileOutputPath);
        
        const mobileStats = fs.statSync(mobileOutputPath);
        const mobileFileSizeInMB = (mobileStats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`📱 Mobile version created: ${mobileOutputPath}`);
        console.log(`📊 Mobile file size: ${mobileFileSizeInMB} MB`);
        
    } catch (error) {
        console.error('❌ Error creating smart white background image:', error);
    }
}

// Run the script
createSmartWhiteBackground(); 