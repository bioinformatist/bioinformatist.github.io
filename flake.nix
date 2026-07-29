{
  description = "Development shell for bioinformatist.github.io";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/64c08a7ca051951c8eae34e3e3cb1e202fe36786";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];

      forAllSystems =
        f:
        nixpkgs.lib.genAttrs systems (
          system:
          f {
            pkgs = import nixpkgs { inherit system; };
          }
        );
    in
    {
      devShells = forAllSystems (
        { pkgs }:
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.actionlint
              pkgs.imagemagick
              pkgs.noto-fonts-cjk-sans
              pkgs.nodejs_22
              pkgs.zola
            ];
          };

          lighthouse = pkgs.mkShell {
            packages = [
              pkgs.google-lighthouse
              pkgs.imagemagick
              pkgs.nodejs_22
              pkgs.zola
            ] ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
              pkgs.chromium
              pkgs.noto-fonts-cjk-sans
            ];

            shellHook = pkgs.lib.optionalString pkgs.stdenv.isLinux ''
              export CHROME_PATH="${pkgs.chromium}/bin/chromium"
            '';
          };
        }
      );
    };
}
