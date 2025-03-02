// Professional pulse animation effect for LactiCode hero image using p5.js
let canvas;
let pulses = [];
let imgPosition = { x: 0, y: 0, width: 0, height: 0 };
let imgLoaded = false;
let canvasReady = false;
let animationReady = false;
let lastPulseTime = 0;
let pulseInterval = 700; // milliseconds between new pulses (slightly faster)
let maxPulses = 15; // increased max pulses for more visual impact

// Enhanced color palette with stronger alpha values for better visibility
const COLORS = [
  [64, 192, 255, 120],    // Light blue with higher alpha
  [28, 169, 243, 130],    // LactiCode blue with higher alpha
  [102, 204, 255, 110],   // Sky blue with higher alpha
  [0, 153, 255, 125],     // Bright blue with higher alpha
  [59, 38, 219, 100]      // Purple with higher alpha
];

// Debug flag - set to true to show console messages for troubleshooting
const DEBUG = true;

function debug(message) {
  if (DEBUG) {
    console.log(`[Pulse Animation] ${message}`);
  }
}

function setup() {
  debug("Setup called");
  // Only proceed when DOM is fully ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initCanvas();
  } else {
    document.addEventListener('DOMContentLoaded', initCanvas);
  }
}

function initCanvas() {
  debug("Initializing canvas");
  const container = document.getElementById('pulse-container');
  if (!container) {
    // If container not found, try again in a moment
    debug("Container not found, retrying...");
    setTimeout(initCanvas, 100);
    return;
  }
  
  debug(`Container found with dimensions: ${container.offsetWidth}x${container.offsetHeight}`);
  
  // Create canvas with a larger size multiplier for better visibility of pulses
  canvas = createCanvas(container.offsetWidth * 2, container.offsetHeight * 2);
  canvas.parent('pulse-container');
  
  // Set canvas positioning for proper alignment
  canvas.style('position', 'absolute');
  canvas.style('top', '50%');
  canvas.style('left', '50%');
  canvas.style('transform', 'translate(-50%, -50%)');
  canvas.style('z-index', '2');
  canvas.style('pointer-events', 'none'); // Ensure canvas doesn't block interactions
  
  // Flag that canvas is ready
  canvasReady = true;
  debug("Canvas ready");
  
  // Force animation to start even if image isn't fully detected
  setTimeout(() => {
    if (!animationReady) {
      debug("Forcing animation start after timeout");
      forceStartAnimation();
    }
  }, 1000);
  
  // Wait for image to be properly loaded before initializing animation
  waitForImage();
}

function forceStartAnimation() {
  // Use default positioning if image not detected
  imgPosition = {
    x: width / 2,
    y: height / 2,
    width: 250,  // Default reasonable size
    height: 250
  };
  imgLoaded = true;
  finishSetup();
}

function waitForImage() {
  debug("Waiting for hero image");
  const heroImg = document.querySelector('.right-img img');
  
  if (heroImg) {
    debug("Hero image element found");
    if (heroImg.complete) {
      // Image is already loaded
      debug("Image already loaded");
      finishSetup();
    } else {
      // Wait for image to load
      debug("Adding load event listener to image");
      heroImg.addEventListener('load', finishSetup);
    }
  } else {
    // Try again in a moment if image not found
    setTimeout(waitForImage, 100);
  }
}

function finishSetup() {
  debug("Finishing setup");
  // Update image position immediately
  updateImagePosition();
  
  // Initialize with pulses at different stages for immediate visual interest
  for (let i = 0; i < 5; i++) {  // Increased initial pulses
    const pulse = new Pulse();
    // Start pulses at different stages
    pulse.size = (i + 1) * 0.3 * (imgPosition.width || 250);
    pulse.delay = i * 8;
    pulses.push(pulse);
  }
  
  // Set animation as ready
  animationReady = true;
  debug("Animation ready");
  
  // Schedule regular position updates to ensure accuracy
  // This helps prevent glitches when the page is still settling
  const positionInterval = setInterval(() => {
    updateImagePosition();
    // After 2 seconds, reduce frequency of position checks
    if (frameCount > 120) {
      clearInterval(positionInterval);
      // Continue with less frequent updates
      setInterval(updateImagePosition, 2000);
    }
  }, 100);
}

function draw() {
  if (!animationReady) return;
  
  clear(); // Clear the canvas on each frame
  
  // Ensure we have at least 3 pulses at all times for visual impact
  if (pulses.length < 3) {
    pulses.push(new Pulse());
    lastPulseTime = millis();
  }
  
  // Update and display all pulses
  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].update();
    pulses[i].display();
    
    // Remove pulses that have completed their lifecycle
    if (pulses[i].isDone()) {
      pulses.splice(i, 1);
    }
  }
  
  // Add new pulses at consistent intervals, but only if we haven't reached max
  const currentTime = millis();
  if (currentTime - lastPulseTime > pulseInterval && pulses.length < maxPulses) {
    pulses.push(new Pulse());
    lastPulseTime = currentTime;
    
    // Slightly vary the next interval for a more organic feeling
    pulseInterval = random(600, 800);  // Slightly faster interval
  }
}

function windowResized() {
  if (!canvasReady) return;
  
  debug("Window resized, updating canvas");
  const container = document.getElementById('pulse-container');
  if (container) {
    // Resize canvas with the same multiplier as in setup
    resizeCanvas(container.offsetWidth * 2, container.offsetHeight * 2);
    updateImagePosition();
  }
}

function updateImagePosition() {
  // Get the position of the hero image
  const heroImg = document.querySelector('.right-img img');
  
  if (heroImg && heroImg.complete) {
    // Get image dimensions using a more reliable approach
    const imgRect = heroImg.getBoundingClientRect();
    const containerRect = document.getElementById('pulse-container').getBoundingClientRect();
    
    debug(`Image dimensions: ${imgRect.width}x${imgRect.height}`);
    
    // Calculate the position relative to our canvas
    // Since our canvas is centered with transform, we use half of width and height
    imgPosition = {
      x: width / 2,
      y: height / 2,
      width: Math.max(imgRect.width, 200),  // Ensure minimum size
      height: Math.max(imgRect.height, 200)
    };
    
    // Indicate image is loaded
    imgLoaded = true;
  } else if (!imgLoaded) {
    // If we still don't have an image, use default values
    debug("Using default image position values");
    imgPosition = {
      x: width / 2,
      y: height / 2,
      width: 250,
      height: 250
    };
    imgLoaded = true;
  }
}

class Pulse {
  constructor() {
    if (!imgLoaded) {
      // Use defaults if image isn't loaded yet
      this.size = random(30, 60);  // Larger starting size
      this.maxSize = random(400, 600);  // Larger max size
    } else {
      // Calibrate to image size when available
      this.size = random(0.15, 0.25) * imgPosition.width;  // Larger starting size
      this.maxSize = random(2.5, 3.5) * imgPosition.width;  // Larger max size
    }
    
    // Faster growth rate for more visible animation
    this.growthRate = random(1.2, 1.6);  // Slightly reduced for more control near the end
    this.opacity = 130;  // Higher starting opacity
    
    // Pick a random color from our palette
    const colorIndex = floor(random(COLORS.length));
    this.color = color(
      COLORS[colorIndex][0], 
      COLORS[colorIndex][1], 
      COLORS[colorIndex][2], 
      COLORS[colorIndex][3]
    );
    
    // Subtle rotation for dynamic effect
    this.rotation = random(-0.002, 0.002);  // Slightly reduced rotation for stability
    this.angle = random(TWO_PI);
    
    // Small consistent offset from center
    this.offsetX = random(-8, 8);  // Reduced for more centered effect
    this.offsetY = random(-8, 8);  // Reduced for more centered effect
    
    // More visible stroke weight
    this.strokeWeight = random(2.0, 3.0);  // Further reduced max for consistency
    
    // Short delay before pulse starts
    this.delay = random(0, 15);
    this.active = false;
    
    // Very subtle distortion - further reduced for the outer ring
    this.distortion = random(0.98, 1.02);  // Even less distortion for stability
    
    // Multiple rings with different scales
    this.ringScales = [
      1.0,                  // Main ring
      random(0.84, 0.88),   // Inner ring (slightly randomized)
      random(1.08, 1.12)    // Outer ring (slightly randomized but consistent)
    ];
    
    // Pre-calculate glow parameters for outer ring
    this.glowAmount = random(2, 3);  // How much blur to apply (reduced range)
    
    // Track fadeout state
    this.isFadingOut = false;
    this.fadeOutThreshold = 0.85; // Start special fadeout when we're 85% of max size
  }
  
  update() {
    // Wait for the delay before starting
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    
    this.active = true;
    
    // Calculate progress toward max size
    const progress = this.size / this.maxSize;
    
    // Check if we need to start special fadeout handling
    if (progress >= this.fadeOutThreshold) {
      this.isFadingOut = true;
      
      // Slow down growth as we approach the max size
      // This helps prevent the black circle artifact by giving more frames for fadeout
      const remainingProgress = 1 - progress;
      this.growthRate = this.growthRate * remainingProgress * 1.5;
    }
    
    // Update size
    this.size += this.growthRate;
    
    // Special opacity handling for fadeout
    if (this.isFadingOut) {
      // Enhanced fade calculation for end of animation
      // This creates a much smoother transition to transparency
      const fadeProgress = (this.size - this.fadeOutThreshold * this.maxSize) / 
                          ((1 - this.fadeOutThreshold) * this.maxSize);
      
      // Use cubic easing for smoother fade
      const easedFade = 1 - (fadeProgress * fadeProgress * fadeProgress);
      this.opacity = easedFade * 50; // Reduce max opacity during fadeout
    } else {
      // Normal opacity calculation for main part of animation
      const easedProgress = 1 - Math.pow(1 - progress, 2.5);
      this.opacity = lerp(130, 50, easedProgress);
    }
    
    // Clamp opacity to prevent negative values
    this.opacity = Math.max(0, this.opacity);
    
    // Subtle rotation continues
    this.angle += this.rotation;
  }
  
  display() {
    if (!this.active) return;
    
    push();
    noFill();
    
    // Draw centered on image position with slight offset
    translate(imgPosition.x + this.offsetX, imgPosition.y + this.offsetY);
    rotate(this.angle);
    
    // Early exit if nearly invisible - prevents artifacts at the end
    if (this.opacity < 2) {
      pop();
      return;
    }
    
    // Outer glow ring - draw this first for layering (fix for glitching)
    const outerRingSize = this.size * this.ringScales[2];
    
    // Adjust alpha of outer ring based on fadeout state
    const outerBaseAlpha = this.isFadingOut 
      ? Math.max(0, this.opacity * 0.3) // Lower alpha during fadeout
      : this.opacity * 0.4;
      
    // Only draw outer glow when visible enough
    if (outerBaseAlpha > 3) {
      // Draw multiple faint outer rings for glow effect
      for (let i = 0; i < 3; i++) {
        const glowSize = outerRingSize + i * this.glowAmount;
        const glowAlpha = outerBaseAlpha * (1 - i * 0.3);  // Fade out for outer glow rings
        
        // Skip drawing if alpha would be imperceptible
        if (glowAlpha < 3) continue;
        
        strokeWeight(1.2 - i * 0.3);  // Thinner strokes for glow
        
        // Ensure alpha is always positive and not too low
        const safeAlpha = Math.max(3, glowAlpha);
        
        stroke(
          this.color.levels[0],
          this.color.levels[1], 
          this.color.levels[2], 
          safeAlpha
        );
        
        // Perfect circles for outer rings to avoid distortion artifacts
        ellipse(0, 0, glowSize, glowSize);
      }
    }
    
    // Don't draw inner rings during final fadeout to prevent artifacts
    if (this.isFadingOut && this.opacity < 15) {
      pop();
      return;
    }
    
    // Medium ring with consistent position
    strokeWeight(this.strokeWeight);
    
    // Ensure alpha is always positive
    const mediumAlpha = Math.max(3, this.opacity * 0.8);
    
    stroke(
      this.color.levels[0],
      this.color.levels[1], 
      this.color.levels[2], 
      mediumAlpha
    );
    
    const middleRingSize = this.size * this.ringScales[1];
    ellipse(0, 0, middleRingSize, middleRingSize * this.distortion);
    
    // Main pulse circle - drawn last to appear on top
    const mainAlpha = Math.max(5, this.opacity); // Ensure main alpha is never too low
    this.color.setAlpha(mainAlpha);
    stroke(this.color);
    ellipse(0, 0, this.size, this.size * this.distortion);
    
    pop();
  }
  
  isDone() {
    // More reliable completion check - consider both size and opacity
    return this.active && (
      this.size >= this.maxSize || 
      this.opacity <= 2 || 
      (this.isFadingOut && this.growthRate < 0.05)
    );
  }
} 