fn main() {
    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        // Keep the build machine's absolute PDB path out of the Windows executable.
        println!("cargo:rustc-link-arg-bin=slayer-planner=/PDBALTPATH:%_PDB%");
    }
    tauri_build::build();
}
