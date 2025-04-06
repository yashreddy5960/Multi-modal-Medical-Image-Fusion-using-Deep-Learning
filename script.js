document.addEventListener("DOMContentLoaded", () => {
  // Tab switching functionality
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons and contents
      tabBtns.forEach((b) => b.classList.remove("active"))
      tabContents.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked button and corresponding content
      btn.classList.add("active")
      const tabId = btn.getAttribute("data-tab")
      document.getElementById(tabId).classList.add("active")
    })
  })

  // Image upload preview functionality
  setupImageUpload("mri-upload", "mri-image-preview")
  setupImageUpload("ct-upload", "ct-image-preview")
  setupImageUpload("ct2-upload", "ct2-image-preview")
  setupImageUpload("pet-upload", "pet-image-preview")
  setupImageUpload("mri2-upload", "mri2-image-preview")
  setupImageUpload("pet2-upload", "pet2-image-preview")

  // Setup fusion buttons
  document.getElementById("fusion-btn-mri-ct").addEventListener("click", () => {
    performFusion("mri-image-preview", "ct-image-preview", "fusion-method-mri-ct")
  })

  document.getElementById("fusion-btn-ct-pet").addEventListener("click", () => {
    performFusion("ct2-image-preview", "pet-image-preview", "fusion-method-ct-pet")
  })

  document.getElementById("fusion-btn-mri-pet").addEventListener("click", () => {
    performFusion("mri2-image-preview", "pet2-image-preview", "fusion-method-mri-pet")
  })

  // Download button functionality
  document.getElementById("download-btn").addEventListener("click", downloadFusedImage)

  // Create placeholder diagram
  createPlaceholderDiagram()
})

// Function to handle image upload and preview
function setupImageUpload(inputId, previewId) {
  const input = document.getElementById(inputId)
  const preview = document.getElementById(previewId)

  input.addEventListener("change", function () {
    const file = this.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        preview.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
  })
}

// Function to perform image fusion
function performFusion(image1Id, image2Id, methodId) {
  const img1 = document.getElementById(image1Id)
  const img2 = document.getElementById(image2Id)
  const method = document.getElementById(methodId).value
  const fusedImageElement = document.getElementById("fused-image")

  // Check if both images are uploaded
  if (img1.src.includes("placeholder.png") || img2.src.includes("placeholder.png")) {
    alert("Please upload both images before fusion")
    return
  }

  // Create canvas elements for processing
  const canvas1 = document.createElement("canvas")
  const ctx1 = canvas1.getContext("2d")
  const canvas2 = document.createElement("canvas")
  const ctx2 = canvas2.getContext("2d")
  const canvasResult = document.createElement("canvas")
  const ctxResult = canvasResult.getContext("2d")

  // Load images and perform fusion
  const image1 = new Image()
  image1.crossOrigin = "anonymous"
  image1.src = img1.src

  image1.onload = () => {
    canvas1.width = image1.width
    canvas1.height = image1.height
    ctx1.drawImage(image1, 0, 0)

    const image2 = new Image()
    image2.crossOrigin = "anonymous"
    image2.src = img2.src

    image2.onload = () => {
      // Resize second image to match first image dimensions
      canvas2.width = canvas1.width
      canvas2.height = canvas1.height
      ctx2.drawImage(image2, 0, 0, canvas2.width, canvas2.height)

      // Set result canvas dimensions
      canvasResult.width = canvas1.width
      canvasResult.height = canvas1.height

      // Get image data
      const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height)
      const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height)
      const resultImageData = ctxResult.createImageData(canvas1.width, canvas1.height)

      // Perform fusion based on selected method
      switch (method) {
        case "average":
          averageFusion(imageData1, imageData2, resultImageData)
          break
        case "maximum":
          maximumFusion(imageData1, imageData2, resultImageData)
          break
        case "pca":
          pcaFusion(imageData1, imageData2, resultImageData)
          break
        case "wavelet":
        default:
          waveletFusion(imageData1, imageData2, resultImageData)
          break
      }

      // Put the result image data on the canvas
      ctxResult.putImageData(resultImageData, 0, 0)

      // Display the result
      fusedImageElement.src = canvasResult.toDataURL()

      // Calculate and display metrics
      calculateMetrics(imageData1, imageData2, resultImageData)

      // Scroll to results section
      document.getElementById("results").scrollIntoView({ behavior: "smooth" })
    }
  }
}

// Fusion methods implementation
function averageFusion(imageData1, imageData2, resultImageData) {
  for (let i = 0; i < imageData1.data.length; i += 4) {
    resultImageData.data[i] = (imageData1.data[i] + imageData2.data[i]) / 2 // R
    resultImageData.data[i + 1] = (imageData1.data[i + 1] + imageData2.data[i + 1]) / 2 // G
    resultImageData.data[i + 2] = (imageData1.data[i + 2] + imageData2.data[i + 2]) / 2 // B
    resultImageData.data[i + 3] = 255 // Alpha
  }
}

function maximumFusion(imageData1, imageData2, resultImageData) {
  for (let i = 0; i < imageData1.data.length; i += 4) {
    resultImageData.data[i] = Math.max(imageData1.data[i], imageData2.data[i]) // R
    resultImageData.data[i + 1] = Math.max(imageData1.data[i + 1], imageData2.data[i + 1]) // G
    resultImageData.data[i + 2] = Math.max(imageData1.data[i + 2], imageData2.data[i + 2]) // B
    resultImageData.data[i + 3] = 255 // Alpha
  }
}

function pcaFusion(imageData1, imageData2, resultImageData) {
  // Simple PCA-based fusion (simplified implementation)
  // Convert to grayscale and calculate weights
  let sum1 = 0,
    sum2 = 0
  const gray1 = new Array(imageData1.width * imageData1.height)
  const gray2 = new Array(imageData2.width * imageData2.height)

  // Convert to grayscale
  for (let i = 0, j = 0; i < imageData1.data.length; i += 4, j++) {
    gray1[j] = 0.299 * imageData1.data[i] + 0.587 * imageData1.data[i + 1] + 0.114 * imageData1.data[i + 2]
    gray2[j] = 0.299 * imageData2.data[i] + 0.587 * imageData2.data[i + 1] + 0.114 * imageData2.data[i + 2]
    sum1 += gray1[j]
    sum2 += gray2[j]
  }

  // Calculate variance
  const mean1 = sum1 / gray1.length
  const mean2 = sum2 / gray2.length
  let var1 = 0,
    var2 = 0

  for (let j = 0; j < gray1.length; j++) {
    var1 += Math.pow(gray1[j] - mean1, 2)
    var2 += Math.pow(gray2[j] - mean2, 2)
  }

  var1 /= gray1.length
  var2 /= gray2.length

  // Calculate weights based on variance
  const weight1 = var1 / (var1 + var2)
  const weight2 = var2 / (var1 + var2)

  // Apply weighted fusion
  for (let i = 0; i < imageData1.data.length; i += 4) {
    resultImageData.data[i] = weight1 * imageData1.data[i] + weight2 * imageData2.data[i] // R
    resultImageData.data[i + 1] = weight1 * imageData1.data[i + 1] + weight2 * imageData2.data[i + 1] // G
    resultImageData.data[i + 2] = weight1 * imageData1.data[i + 2] + weight2 * imageData2.data[i + 2] // B
    resultImageData.data[i + 3] = 255 // Alpha
  }
}

function waveletFusion(imageData1, imageData2, resultImageData) {
  // Simplified wavelet fusion (using a basic approximation)
  // In a real implementation, you would use a proper wavelet transform library

  // Convert to grayscale for analysis
  const gray1 = new Array(imageData1.width * imageData1.height)
  const gray2 = new Array(imageData2.width * imageData2.height)

  for (let i = 0, j = 0; i < imageData1.data.length; i += 4, j++) {
    gray1[j] = 0.299 * imageData1.data[i] + 0.587 * imageData1.data[i + 1] + 0.114 * imageData1.data[i + 2]
    gray2[j] = 0.299 * imageData2.data[i] + 0.587 * imageData2.data[i + 1] + 0.114 * imageData2.data[i + 2]
  }

  // Calculate local activity level (simplified)
  const activity1 = new Array(gray1.length)
  const activity2 = new Array(gray2.length)
  const width = imageData1.width

  for (let y = 1; y < imageData1.height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      // Calculate local variance as activity measure
      activity1[idx] =
        Math.abs(gray1[idx] - gray1[idx - 1]) +
        Math.abs(gray1[idx] - gray1[idx + 1]) +
        Math.abs(gray1[idx] - gray1[idx - width]) +
        Math.abs(gray1[idx] - gray1[idx + width])

      activity2[idx] =
        Math.abs(gray2[idx] - gray2[idx - 1]) +
        Math.abs(gray2[idx] - gray2[idx + 1]) +
        Math.abs(gray2[idx] - gray2[idx - width]) +
        Math.abs(gray2[idx] - gray2[idx + width])
    }
  }

  // Fusion based on activity level
  for (let i = 0, j = 0; i < imageData1.data.length; i += 4, j++) {
    let weight1 = 0.5,
      weight2 = 0.5

    if (j > width && j < gray1.length - width && j % width !== 0 && j % width !== width - 1) {
      if (activity1[j] > activity2[j]) {
        weight1 = 0.75
        weight2 = 0.25
      } else if (activity2[j] > activity1[j]) {
        weight1 = 0.25
        weight2 = 0.75
      }
    }

    resultImageData.data[i] = weight1 * imageData1.data[i] + weight2 * imageData2.data[i] // R
    resultImageData.data[i + 1] = weight1 * imageData1.data[i + 1] + weight2 * imageData2.data[i + 1] // G
    resultImageData.data[i + 2] = weight1 * imageData1.data[i + 2] + weight2 * imageData2.data[i + 2] // B
    resultImageData.data[i + 3] = 255 // Alpha
  }
}

// Function to calculate metrics
function calculateMetrics(imageData1, imageData2, resultImageData) {
  // Calculate Signal-to-Noise Ratio (SNR)
  const snr = calculateSNR(imageData1, imageData2, resultImageData)
  document.getElementById("snr-value").textContent = snr.toFixed(2) + " dB"

  // Calculate Peak Signal-to-Noise Ratio (PSNR)
  const psnr = calculatePSNR(imageData1, imageData2, resultImageData)
  document.getElementById("psnr-value").textContent = psnr.toFixed(2) + " dB"

  // Calculate Structural Similarity Index (SSIM)
  const ssim = calculateSSIM(imageData1, imageData2, resultImageData)
  document.getElementById("ssim-value").textContent = ssim.toFixed(3)

  // Calculate Mutual Information (MI)
  const mi = calculateMI(imageData1, imageData2, resultImageData)
  document.getElementById("mi-value").textContent = mi.toFixed(3) + " bits"
}

function calculateSNR(imageData1, imageData2, resultImageData) {
  // Calculate signal power (using original images as reference)
  let signalPower = 0
  let noisePower = 0

  for (let i = 0; i < resultImageData.data.length; i += 4) {
    const signal = (imageData1.data[i] + imageData2.data[i]) / 2
    const noise = resultImageData.data[i] - signal

    signalPower += signal * signal
    noisePower += noise * noise
  }

  signalPower /= resultImageData.data.length / 4
  noisePower /= resultImageData.data.length / 4

  // Avoid division by zero
  if (noisePower === 0) return 100

  // Calculate SNR in decibels
  return 10 * Math.log10(signalPower / noisePower)
}

function calculatePSNR(imageData1, imageData2, resultImageData) {
  // Calculate Mean Squared Error (MSE)
  let mse = 0
  const maxPixelValue = 255

  for (let i = 0; i < resultImageData.data.length; i += 4) {
    const referencePixel = (imageData1.data[i] + imageData2.data[i]) / 2
    const diff = resultImageData.data[i] - referencePixel
    mse += diff * diff
  }

  mse /= resultImageData.data.length / 4

  // Avoid division by zero
  if (mse === 0) return 100

  // Calculate PSNR
  return 10 * Math.log10((maxPixelValue * maxPixelValue) / mse)
}

function calculateSSIM(imageData1, imageData2, resultImageData) {
  // Simplified SSIM calculation
  // Constants to stabilize division with weak denominator
  const C1 = (0.01 * 255) ** 2
  const C2 = (0.03 * 255) ** 2

  // Calculate means
  let mean1 = 0,
    mean2 = 0,
    meanResult = 0

  for (let i = 0; i < resultImageData.data.length; i += 4) {
    mean1 += imageData1.data[i]
    mean2 += imageData2.data[i]
    meanResult += resultImageData.data[i]
  }

  const pixelCount = resultImageData.data.length / 4
  mean1 /= pixelCount
  mean2 /= pixelCount
  meanResult /= pixelCount

  // Calculate variances and covariance
  let var1 = 0,
    var2 = 0,
    varResult = 0
  let cov1Result = 0,
    cov2Result = 0

  for (let i = 0; i < resultImageData.data.length; i += 4) {
    var1 += (imageData1.data[i] - mean1) ** 2
    var2 += (imageData2.data[i] - mean2) ** 2
    varResult += (resultImageData.data[i] - meanResult) ** 2

    cov1Result += (imageData1.data[i] - mean1) * (resultImageData.data[i] - meanResult)
    cov2Result += (imageData2.data[i] - mean2) * (resultImageData.data[i] - meanResult)
  }

  var1 /= pixelCount
  var2 /= pixelCount
  varResult /= pixelCount
  cov1Result /= pixelCount
  cov2Result /= pixelCount

  // Calculate SSIM for each source image and average
  const ssim1 =
    ((2 * mean1 * meanResult + C1) * (2 * cov1Result + C2)) /
    ((mean1 ** 2 + meanResult ** 2 + C1) * (var1 + varResult + C2))

  const ssim2 =
    ((2 * mean2 * meanResult + C1) * (2 * cov2Result + C2)) /
    ((mean2 ** 2 + meanResult ** 2 + C1) * (var2 + varResult + C2))

  return (ssim1 + ssim2) / 2
}

function calculateMI(imageData1, imageData2, resultImageData) {
  // Simplified Mutual Information calculation
  // Create histograms (using only red channel for simplicity)
  const bins = 256
  const hist1 = new Array(bins).fill(0)
  const hist2 = new Array(bins).fill(0)
  const histResult = new Array(bins).fill(0)
  const jointHist1 = Array(bins)
    .fill()
    .map(() => Array(bins).fill(0))
  const jointHist2 = Array(bins)
    .fill()
    .map(() => Array(bins).fill(0))

  const pixelCount = resultImageData.data.length / 4

  // Fill histograms
  for (let i = 0; i < resultImageData.data.length; i += 4) {
    const val1 = Math.floor(imageData1.data[i])
    const val2 = Math.floor(imageData2.data[i])
    const valResult = Math.floor(resultImageData.data[i])

    hist1[val1]++
    hist2[val2]++
    histResult[valResult]++

    jointHist1[val1][valResult]++
    jointHist2[val2][valResult]++
  }

  // Calculate entropies
  let entropy1 = 0,
    entropy2 = 0,
    entropyResult = 0
  let jointEntropy1 = 0,
    jointEntropy2 = 0

  for (let i = 0; i < bins; i++) {
    const p1 = hist1[i] / pixelCount
    const p2 = hist2[i] / pixelCount
    const pResult = histResult[i] / pixelCount

    if (p1 > 0) entropy1 -= p1 * Math.log2(p1)
    if (p2 > 0) entropy2 -= p2 * Math.log2(p2)
    if (pResult > 0) entropyResult -= pResult * Math.log2(pResult)

    for (let j = 0; j < bins; j++) {
      const jp1 = jointHist1[i][j] / pixelCount
      const jp2 = jointHist2[i][j] / pixelCount

      if (jp1 > 0) jointEntropy1 -= jp1 * Math.log2(jp1)
      if (jp2 > 0) jointEntropy2 -= jp2 * Math.log2(jp2)
    }
  }

  // Calculate mutual information
  const mi1 = entropy1 + entropyResult - jointEntropy1
  const mi2 = entropy2 + entropyResult - jointEntropy2

  return (mi1 + mi2) / 2
}

// Function to download the fused image
function downloadFusedImage() {
  const fusedImage = document.getElementById("fused-image")
  if (fusedImage.src.includes("placeholder.png")) {
    alert("No fused image available to download")
    return
  }

  const link = document.createElement("a")
  link.download = "fused_image.png"
  link.href = fusedImage.src
  link.click()
}

// Function to create a placeholder diagram
function createPlaceholderDiagram() {
  const canvas = document.createElement("canvas")
  canvas.width = 600
  canvas.height = 300
  const ctx = canvas.getContext("2d")

  // Set background
  ctx.fillStyle = "#f5f5f5"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw diagram elements
  // MRI image representation
  ctx.fillStyle = "#3498db"
  ctx.fillRect(50, 100, 120, 120)
  ctx.fillStyle = "#2c3e50"
  ctx.font = "16px Roboto"
  ctx.fillText("MRI Image", 70, 80)

  // CT image representation
  ctx.fillStyle = "#e74c3c"
  ctx.fillRect(430, 100, 120, 120)
  ctx.fillStyle = "#2c3e50"
  ctx.fillText("CT Image", 450, 80)

  // Fusion process
  ctx.fillStyle = "#2c3e50"
  ctx.beginPath()
  ctx.moveTo(170, 160)
  ctx.lineTo(240, 160)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(430, 160)
  ctx.lineTo(360, 160)
  ctx.stroke()

  // Fusion box
  ctx.fillStyle = "#27ae60"
  ctx.fillRect(240, 130, 120, 60)
  ctx.fillStyle = "#fff"
  ctx.fillText("Fusion", 275, 165)

  // Result arrow
  ctx.fillStyle = "#2c3e50"
  ctx.beginPath()
  ctx.moveTo(300, 190)
  ctx.lineTo(300, 240)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(295, 230)
  ctx.lineTo(300, 240)
  ctx.lineTo(305, 230)
  ctx.fill()

  // Result text
  ctx.fillStyle = "#2c3e50"
  ctx.fillText("Fused Image", 270, 260)

  // Set the diagram as the placeholder image
  const diagramPlaceholder = document.getElementById("diagram-placeholder")
  diagramPlaceholder.src = canvas.toDataURL()
}

