const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createWhiterBackground() {
    try {
        console.log('🖼️  Creating image with whiter background areas...');
        
        const image1Path = path.join(__dirname, '../public/images/1F.png');
        const image2Path = path.join(__dirname, '../public/images/2F.png');
        const outputPath = path.join(__dirname, '../public/images/login-bg-whiter.jpg');
        
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
        
        // Process image 1: specifically target background areas
        const processedImage1 = await sharp(image1Path)
            .resize(metadata1.width, metadata1.height, { fit: 'cover' })
            .modulate({
                brightness: 2.0,    // Very high brightness to whiten background
                saturation: 1.3,    // Moderate saturation to keep fruits vibrant
                hue: 0             // Keep original hue
            })
            .gamma(1.4)            // High gamma to brighten background areas significantly
            .linear(1.5, 0.05)     // High contrast and very bright shadows
            .sharpen(0.5, 1, 1)    // Slight sharpening to enhance edges
            .toBuffer();
        
        // Process image 2: specifically target background areas
        const processedImage2 = await sharp(image2Path)
            .resize(metadata2.width, metadata2.height, { fit: 'cover' })
            .modulate({
                brightness: 2.0,    // Very high brightness to whiten background
                saturation: 1.3,    // Moderate saturation to keep fruits vibrant
                hue: 0             // Keep original hue
            })
            .gamma(1.4)            // High gamma to brighten background areas significantly
            .linear(1.5, 0.05)     // High contrast and very bright shadows
            .sharpen(0.5, 1, 1)    // Slight sharpening to enhance edges
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
            quality: 90,        // Higher quality for better detail
            progressive: true,  // Progressive JPEG for better loading
            mozjpeg: true       // Use mozjpeg for better compression
        })
        .toFile(outputPath);
        
        // Get file size of the new image
        const stats = fs.statSync(outputPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ Whiter background image created successfully!`);
        console.log(`📁 Output: ${outputPath}`);
        console.log(`📊 File size: ${fileSizeInMB} MB`);
        console.log(`🎯 Quality: 90% JPEG with enhanced background whitening`);
        
        // Also create a smaller version for mobile
        const mobileOutputPath = path.join(__dirname, '../public/images/login-bg-whiter-mobile.jpg');
        
        await sharp(outputPath)
            .resize(1200, 800, { fit: 'cover' })
            .jpeg({
                quality: 85,
                progressive: true,
                mozjpeg: true
            })
            .toFile(mobileOutputPath);
        
        const mobileStats = fs.statSync(mobileOutputPath);
        const mobileFileSizeInMB = (mobileStats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`📱 Mobile version created: ${mobileOutputPath}`);
        console.log(`📊 Mobile file size: ${mobileFileSizeInMB} MB`);
        
    } catch (error) {
        console.error('❌ Error creating whiter background image:', error);
    }
}

// Run the script
createWhiterBackground(); 