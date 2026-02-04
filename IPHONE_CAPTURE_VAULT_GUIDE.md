# 📱 iPhone Capture Vault - Complete Feature Guide

## 🎯 Overview

The iPhone Capture Vault lets you upload screenshots or screen recordings from ChatGPT, Gemini, or any app, and automatically stitches them into one clean, searchable note with intelligent deduplication and formatting.

---

## ✨ Why This Exists

**iOS Security Limitation**: iOS doesn't allow apps to capture other apps' screens in real-time for privacy reasons. So GhostWriter uses a smart workaround:
1. **You take screenshots** or record your screen
2. **Upload the frames** to GhostWriter
3. **AI processes them** into one clean document

This gives you the same result as live capture, but respects iOS privacy!

---

## 📋 Feature Breakdown

### 1. **Upload Methods** 📤

#### Screenshots
- **What it does**: Upload individual screenshot images
- **Best for**: Capturing specific moments or conversations
- **How to use**:
  1. Take screenshots while scrolling through a thread
  2. Upload all screenshots at once
  3. GhostWriter automatically orders them by time

#### Screen Recording
- **What it does**: Upload a video recording of your screen
- **Best for**: Capturing entire long conversations
- **How to use**:
  1. Start screen recording
  2. Scroll through the entire thread
  3. Stop recording
  4. Upload the video
  5. GhostWriter extracts frames automatically

#### Batch OCR
- **What it does**: Process multiple files at once
- **Best for**: Large conversations with many screenshots
- **How to use**: Select multiple files and process together

---

### 2. **Auto EXIF Sort** 📅

#### What It Does
Automatically sorts your screenshots by the timestamp embedded in the image (EXIF data).

#### Why It Matters
- Screenshots might be out of order when uploaded
- EXIF timestamps show when the screenshot was actually taken
- Ensures the conversation flows correctly

#### Options:
- **Sort by Time**: Uses EXIF timestamps (most accurate)
- **Sort by Name**: Uses filename order
- **Auto Order**: Smart detection of best method

#### Best Practice
✅ **Always use "Sort by Time"** - It's the most reliable way to get chronological order

---

### 3. **Deduplication** 🔄

#### What It Does
Removes repeated text that appears in multiple screenshots.

#### Why It Matters
When scrolling through a conversation:
- The same messages appear in multiple screenshots
- Without dedupe, you'd have the same text 5-10 times
- Dedupe keeps only unique content

#### Settings:

**Min chars** (Default: 40)
- Minimum characters before considering text for deduplication
- **Lower** = More aggressive dedupe (might remove short unique messages)
- **Higher** = Less aggressive (keeps more content)
- **Best**: 40-60 characters

**Similarity** (Default: 0.85)
- How similar text must be to be considered a duplicate
- **0.85** = 85% similar = duplicate
- **Lower** = More aggressive (removes more)
- **Higher** = Less aggressive (keeps more)
- **Best**: 0.85-0.90

**Dedupe window** (Default: 8)
- How many previous text blocks to check against
- **Lower** = Faster, but might miss duplicates
- **Higher** = Slower, but catches more duplicates
- **Best**: 8-12 for most conversations

#### Best Practice
✅ **Enable deduplication** for scrolling conversations
✅ **Use default settings** unless you notice issues
✅ **Increase similarity to 0.90** if important content is being removed

---

### 4. **Line Heal** 🔧

#### What It Does
Fixes broken line breaks and formatting issues from OCR.

#### Why It Matters
OCR sometimes breaks text incorrectly:
- "Hello\nworld" becomes "Helloworld"
- Sentences get split mid-word
- Line heal fixes these automatically

#### Best Practice
✅ **Always enable** - It makes text much more readable
✅ **No performance cost** - Runs automatically

---

### 5. **Image Enhancement** 🎨

#### What It Does
Improves image quality before OCR to get better text recognition.

#### Settings:

**Grayscale** (Default: Off)
- Converts images to black and white
- **Why**: Removes color noise that confuses OCR
- **Best for**: Colorful UIs, images with lots of colors
- **Trade-off**: Might lose some context, but improves text accuracy

**Contrast** (Default: 20)
- Increases contrast between text and background
- **Higher** = More contrast = Better text recognition
- **Best**: 15-25 for most screenshots
- **Too high** = Text becomes hard to read

**Image max width** (Default: 1600px)
- Resizes images before processing
- **Why**: Smaller images = Faster processing
- **Larger** = Better quality but slower
- **Best**: 1600-2000px for iPhone screenshots

**Video max width** (Default: 1280px)
- Resizes video frames before processing
- **Why**: Videos have many frames, need to be smaller
- **Best**: 1280-1600px for screen recordings

#### Best Practice
✅ **Enable grayscale** for colorful apps (ChatGPT, Gemini)
✅ **Increase contrast to 25** if text recognition is poor
✅ **Keep max width at 1600** for good balance

---

### 6. **Auto Segment** 📑

#### What It Does
Automatically creates breaks in the document when there are time gaps between screenshots.

#### Why It Matters
- Long conversations have natural breaks
- Auto segment creates sections for readability
- Makes it easier to find specific parts

#### Settings:

**Gap minutes** (Default: 8)
- How many minutes between screenshots to create a new segment
- **Lower** = More segments (more breaks)
- **Higher** = Fewer segments (fewer breaks)
- **Best**: 5-10 minutes for most conversations

**Segment timestamps** (Default: On)
- Shows when each segment was captured
- **Why**: Helps you find when things happened
- **Best**: Always enable

#### Best Practice
✅ **Enable auto segment** for long conversations
✅ **Set gap to 5-8 minutes** for natural breaks
✅ **Keep timestamps enabled** for reference

---

### 7. **Noise Filter** 🧹

#### What It Does
Removes UI elements and repeated phrases that aren't part of the actual conversation.

#### Why It Matters
Screenshots include:
- UI buttons ("Copy", "Share", "New chat")
- Navigation elements
- Repeated system messages
- Noise filter removes these automatically

#### Settings:

**Noise phrases** (One per line)
- Custom phrases to remove
- Examples: "Regenerate response", "Stop generating", "Copied"
- **Best**: Add common UI elements you see

#### Best Practice
✅ **Enable noise filter** for cleaner output
✅ **Add common UI phrases** you see in your screenshots
✅ **Review output** and add more phrases as needed

---

### 8. **Role Normalize** 👤

#### What It Does
Standardizes speaker labels (User, Assistant, ChatGPT, etc.) to consistent names.

#### Why It Matters
Different apps use different labels:
- ChatGPT: "User:", "ChatGPT:"
- Gemini: "You:", "Gemini:"
- Role normalize makes them all consistent

#### Settings:

**Role patterns** (Two groups)
- **Group 1**: User patterns (User:, You:, Me:)
- **Group 2**: Assistant patterns (Assistant:, ChatGPT:, Gemini:, AI:)
- **Best**: Add all variations you see

#### Best Practice
✅ **Enable role normalize** for multi-app conversations
✅ **Add all label variations** you encounter
✅ **Review output** to ensure labels are correct

---

### 9. **Output Format** 📄

#### Options:

**PLAIN**
- Simple text, no formatting
- **Best for**: Quick notes, simple conversations

**MARKDOWN**
- Formatted with headers, lists, code blocks
- **Best for**: Documentation, sharing, readability

**JSON**
- Structured data format
- **Best for**: Processing, APIs, automation

#### Best Practice
✅ **Use MARKDOWN** for most use cases (best readability)
✅ **Use PLAIN** for simple text extraction
✅ **Use JSON** for programmatic use

---

### 10. **Auto Headings** 📝

#### What It Does
Automatically generates section titles based on content.

#### Settings:

**Heading words** (Default: 8)
- How many words to use for headings
- **Lower** = Shorter headings
- **Higher** = Longer headings
- **Best**: 6-10 words

#### Best Practice
✅ **Enable for long conversations** to create structure
✅ **Use 6-8 words** for concise headings
✅ **Disable for short conversations** (not needed)

---

### 11. **Session Management** 📚

#### What It Does
Organizes captures into named sessions with metadata.

#### Settings:

**Session name** (Default: "ChatGPT Project Threads")
- Name for this capture session
- **Best**: Use descriptive names (e.g., "Python Tutorial", "Project Planning")

**Include header**
- Adds session name and timestamp to output
- **Best**: Always enable for organization

**Source app** (Default: ChatGPT)
- Tracks which app the capture came from
- **Best**: Select the correct app for better processing

#### Best Practice
✅ **Use descriptive session names** for easy finding later
✅ **Always include header** for context
✅ **Select correct source app** for optimal processing

---

## 🎯 Best Practices by Use Case

### 📱 Capturing ChatGPT Conversations

1. **Take screenshots** while scrolling (don't worry about order)
2. **Upload all screenshots** at once
3. **Enable Auto EXIF Sort** (Sort by Time)
4. **Enable Deduplication** (default settings)
5. **Enable Line Heal** (always)
6. **Enable Grayscale** (ChatGPT has colorful UI)
7. **Set Contrast to 25** (better text recognition)
8. **Enable Auto Segment** (gap: 8 minutes)
9. **Enable Noise Filter** (add ChatGPT UI phrases)
10. **Enable Role Normalize** (User:, ChatGPT:)
11. **Output: MARKDOWN** (best readability)
12. **Run OCR** and review output

### 🤖 Capturing Gemini Conversations

1. **Same as ChatGPT** but:
2. **Role patterns**: "You:", "Gemini:"
3. **Noise phrases**: Add Gemini-specific UI elements

### 📹 Using Screen Recordings

1. **Start screen recording** before scrolling
2. **Scroll through entire conversation** smoothly
3. **Stop recording** when done
4. **Upload video** (GhostWriter extracts frames)
5. **Use same settings** as screenshots
6. **Video max width: 1280** (good balance)

### 📚 Long Multi-Session Conversations

1. **Create separate sessions** for different topics
2. **Use descriptive session names**
3. **Enable Auto Segment** with shorter gaps (5 minutes)
4. **Enable Auto Headings** for structure
5. **Include timestamps** for reference

---

## ⚡ Quick Start Workflow

### For Most Users (Recommended Settings)

1. ✅ **Auto EXIF Sort**: Sort by Time
2. ✅ **Deduplication**: Enabled (Min chars: 40, Similarity: 0.85)
3. ✅ **Line Heal**: Enabled
4. ✅ **Image Enhance**: Grayscale ON, Contrast: 25
5. ✅ **Auto Segment**: Enabled (Gap: 8 minutes)
6. ✅ **Noise Filter**: Enabled
7. ✅ **Role Normalize**: Enabled
8. ✅ **Output Format**: MARKDOWN
9. ✅ **Auto Headings**: Enabled (8 words)
10. ✅ **Session Name**: Descriptive name

### For Maximum Quality

- Increase **Image max width** to 2000
- Increase **Similarity** to 0.90
- Increase **Dedupe window** to 12
- Enable all enhancement features

### For Maximum Speed

- Decrease **Image max width** to 1200
- Decrease **Dedupe window** to 5
- Disable **Auto Headings**
- Use **PLAIN** format

---

## 🎨 Understanding the Output

### Consolidated Thread
- **What**: The final stitched document
- **Contains**: All unique content in chronological order
- **Format**: Based on your output format setting

### Capture Breakdown
- **Processed**: Number of files processed
- **Emitted**: Number of text blocks extracted
- **Segments**: Number of document sections created
- **Skipped motion**: Frames with no changes
- **Skipped text**: Frames with no text
- **Duplicates**: Text blocks removed as duplicates
- **Noise**: UI elements removed
- **Role tags**: Speaker labels normalized

---

## 💡 Pro Tips

1. **Take screenshots systematically**: Scroll slowly and capture everything
2. **Don't worry about order**: EXIF sort handles it
3. **Review noise phrases**: Add common UI elements you see
4. **Test settings**: Try different combinations for your use case
5. **Use sessions**: Organize by project or topic
6. **Check output**: Review the consolidated thread for accuracy
7. **Adjust as needed**: Fine-tune settings based on results

---

## 🚀 Advanced Usage

### Processing Multiple Conversations
1. Create separate sessions for each conversation
2. Use consistent naming (e.g., "ChatGPT - Project A", "ChatGPT - Project B")
3. Process each session separately
4. Combine outputs if needed

### Extracting Specific Information
1. Use **PLAIN** format for simple extraction
2. Disable **Auto Headings** if not needed
3. Increase **Min chars** to filter out short messages
4. Use **JSON** format for programmatic processing

### Optimizing for Different Apps
- **ChatGPT**: Grayscale ON, Contrast 25, Role normalize enabled
- **Gemini**: Similar settings, different role patterns
- **Notes apps**: Lower contrast, disable grayscale
- **Code editors**: Higher max width, enable line heal

---

## ✨ Result

With these features, GhostWriter transforms messy screenshots into clean, searchable, well-formatted documents that capture the full conversation without duplicates or UI noise!

---

*Capture the thought, leave no trace.* 👻
