# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# ---------- React Native core / Hermes / TurboModules ----------
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-dontwarn com.facebook.**

# New Architecture / Fabric bits that can get stripped when shrinking
-keep class com.facebook.react.fabric.** { *; }

# Reanimated (common cause of release-only crashes)
-keep class com.swmansion.reanimated.** { *; }

# react-native-svg (if you use SVGs)
-keep public class com.horcrux.svg.** { *; }

# Gesture Handler (commonly required)
-keep class com.swmansion.gesturehandler.** { *; }

# ---------- Firebase / Google Play services ----------
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# RNFirebase (io.invertase...) – if you use react-native-firebase modules
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# ---------- ML Kit ----------
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# ---------- React Native Camera (if present) ----------
-keep class org.reactnative.camera.** { *; }
-dontwarn org.reactnative.camera.**

# ---------- Vector Icons: keep font resources in assets ----------
# (shrinkResources doesn't touch assets, but these are harmless reminders)

# ---------- Annotations / reflection ----------
-keepattributes *Annotation*, InnerClasses, EnclosingMethod, Signature

# ---------- If you use BuildConfig via reflection (e.g., react-native-config) ----------
# Replace com.letsmeet with your actual package if different
-keep class com.letsmeet.BuildConfig { *; }
