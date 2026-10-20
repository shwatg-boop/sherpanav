import os

def configure():
    kts_path = "android/app/build.gradle.kts"
    groovy_path = "android/app/build.gradle"
    
    if os.path.exists(kts_path):
        print(f"Configuring signing in {kts_path}...")
        with open(kts_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        signing_block_kts = """
    signingConfigs {
        create("release") {
            storeFile = file("release.keystore")
            storePassword = "sherpanavpass"
            keyAlias = "sherpanav"
            keyPassword = "sherpanavpass"
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
        }
    }
"""
        if "signingConfigs {" not in content:
            content = content.replace("buildTypes {", signing_block_kts + "\n    buildTypes {")
            
        content = content.replace(
            'signingConfig = signingConfigs.getByName("debug")',
            'signingConfig = signingConfigs.getByName("release")'
        )
        content = content.replace(
            'signingConfig = signingConfigs.debug',
            'signingConfig = signingConfigs.getByName("release")'
        )
        
        with open(kts_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully configured release signing in {kts_path}")

    elif os.path.exists(groovy_path):
        print(f"Configuring signing in {groovy_path}...")
        with open(groovy_path, "r", encoding="utf-8") as f:
            content = f.read()

        signing_block_groovy = """
    signingConfigs {
        release {
            storeFile file("release.keystore")
            storePassword "sherpanavpass"
            keyAlias "sherpanav"
            keyPassword "sherpanavpass"
            v1SigningEnabled true
            v2SigningEnabled true
        }
    }
"""
        if "signingConfigs {" not in content:
            content = content.replace("buildTypes {", signing_block_groovy + "\n    buildTypes {")

        content = content.replace(
            'signingConfig signingConfigs.debug',
            'signingConfig signingConfigs.release'
        )

        with open(groovy_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully configured release signing in {groovy_path}")

if __name__ == "__main__":
    configure()
