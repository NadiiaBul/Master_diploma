import librosa
import numpy as np

def extract_features(file_path, sr=22050, n_mfcc=40):
    """
    Завантажує аудіо й повертає усереднені MFCC-ознаки.
    """
    audio, sr = librosa.load(file_path, sr=sr, mono=True)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    mfcc_mean = np.mean(mfcc.T, axis=0)
    return np.expand_dims(mfcc_mean, axis=0)
