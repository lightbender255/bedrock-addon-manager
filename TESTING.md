# Manual Testing Plan for World Source Persistence

## Test Steps:

1. **First Launch Test:**
   - Launch the application for the first time
   - Verify that "Dedicated Server" is selected by default
   - Check that dedicated server worlds are loaded

2. **Switch to Local Worlds:**
   - Click the "Local Worlds" radio button
   - Verify that the world list refreshes and shows local worlds
   - Close the application

3. **Persistence Test:**
   - Reopen the application
   - Verify that "Local Worlds" is still selected
   - Verify that local worlds are loaded automatically

4. **Switch Back Test:**
   - Click "Dedicated Server" radio button
   - Verify dedicated server worlds load
   - Close and reopen the application
   - Verify "Dedicated Server" is still selected

## Expected Results:
- Settings should persist between application restarts
- The world list should automatically load for the selected source
- Radio button selection should match the saved preference
- No errors should appear in the console or logs

## Settings File Location:
Settings are stored at: `C:\Users\{username}\AppData\Roaming\bedrock-addon-manager\config.json`