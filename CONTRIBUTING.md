# **Contributing to Orange ORM**

Thank you for considering a contribution to [orange orm](https://github.com/alfateam/orange-orm)!

## **1. Reporting Issues**

- Begin by exploring the [existing issues](https://github.com/alfateam/orange-orm/issues).
- If you don't find an existing issue related to yours, please open a new one with detailed information.

## **2. Making Changes**
If you're planning significant code changes, it's a good practice to open an issue for discussion. This ensures alignment, reduces duplication of effort, and promotes collaborative problem solving.
1. **Fork & Clone**  
	If you haven't already, fork the repository first.  
	Then, clone it:  
   `git clone https://github.com/YOUR_USERNAME/orange-orm.git`

2. **Create a New Branch**  
   `git checkout -b your-branch-name`

3. **Develop, lint and test**  
   - Make your desired changes or fixes.
   - Verify linting: `npm run lint`
   - Update the tests to reflect your code changes.
	- To run the tests locally:
  		1. Open the project in **VSCode**.
  		2. Ensure you have [Docker](https://docker.com) installed and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) installed in VSCODE.
  		3. Start a local [development container](https://code.visualstudio.com/docs/devcontainers/containers) based on the `.devcontainer` folder.
  		4. Execute the tests within this containerized environment by `npm run test`  

4. **Commit & Describe**  
   `git commit -m "Description of the changes made"`

5. **Push to Your Branch**  
   `git push origin your-branch-name`

6. **Open a Pull Request**  
   Go to your fork on GitHub, select the branch your-branch-name , click the "Contribute" - "Open pull request". Fill out the PR form, and we'll review it as soon as possible!  
   Remember, pull requests will not be accepted if they are failing on GitHub actions.





