# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
  ];

  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        backend = {
          command = ["npm" "start"];
          manager = "web";
          port = 5000;
          dir = "backend";
        };
        frontend = {
          command = ["npm" "start"];
          manager = "web";
          port = 3000;
          dir = "frontend";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        backend-npm-install = "cd backend && npm install";
        frontend-npm-install = "cd frontend && npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
      };
    };
  };
}
