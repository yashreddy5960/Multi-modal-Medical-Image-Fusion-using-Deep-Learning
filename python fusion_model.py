import tensorflow as tf
from tensorflow.keras.layers import Conv2D, Concatenate, Input
from tensorflow.keras.models import Model
import numpy as np
import cv2
import matplotlib.pyplot as plt

def build_fusion_model(input_shape):
    ct_input = Input(shape=input_shape, name="CT_Input")
    mri_input = Input(shape=input_shape, name="MRI_Input")

    # Shared Convolutional Layers
    conv1 = Conv2D(32, (3, 3), activation='relu', padding='same')
    conv2 = Conv2D(64, (3, 3), activation='relu', padding='same')

    ct_features = conv2(conv1(ct_input))
    mri_features = conv2(conv1(mri_input))

    fused_features = Concatenate()([ct_features, mri_features])
    fused_output = Conv2D(1, (3, 3), activation='sigmoid', padding='same', name="Fused_Output")(fused_features)

    model = Model(inputs=[ct_input, mri_input], outputs=fused_output)
    model.compile(optimizer='adam', loss='mse')
    return model

def load_and_preprocess_image(image_path, target_size=(256, 256)):
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    image = cv2.resize(image, target_size)
    image = image / 255.0
    image = np.expand_dims(image, axis=(0, -1))  # Add batch and channel dimensions
    return image

# Example Usage
input_shape = (256, 256, 1)
model = build_fusion_model(input_shape)

# Load sample images (Replace with actual CT and MRI image paths)
ct_image = load_and_preprocess_image("ct_sample.png")
mri_image = load_and_preprocess_image("mri_sample.png")

# Perform Fusion
fused_image = model.predict([ct_image, mri_image])[0, :, :, 0]

# Display Results
plt.figure(figsize=(10, 3))
plt.subplot(1, 3, 1)
plt.title("CT Image")
plt.imshow(ct_image[0, :, :, 0], cmap='gray')

plt.subplot(1, 3, 2)
plt.title("MRI Image")
plt.imshow(mri_image[0, :, :, 0], cmap='gray')

plt.subplot(1, 3, 3)
plt.title("Fused Image")
plt.imshow(fused_image, cmap='gray')

plt.show()
