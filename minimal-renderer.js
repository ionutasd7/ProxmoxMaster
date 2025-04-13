document.addEventListener('DOMContentLoaded', () => {
  console.log('Minimal renderer loaded');
  
  // Basic UI elements
  const mainContent = document.getElementById('content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="container mt-5">
        <div class="row">
          <div class="col-md-6 offset-md-3">
            <div class="card bg-dark text-light">
              <div class="card-header">
                <h3>Proxmox Manager - Minimal Test</h3>
              </div>
              <div class="card-body">
                <p>This is a minimal test of the renderer functionality.</p>
                <button id="test-button" class="btn btn-primary">Test Button</button>
                <div id="result" class="mt-3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Simple event handling
  const testButton = document.getElementById('test-button');
  if (testButton) {
    testButton.addEventListener('click', () => {
      const resultDiv = document.getElementById('result');
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="alert alert-success">
            Button clicked at ${new Date().toLocaleTimeString()}
          </div>
        `;
      }
    });
  }
});