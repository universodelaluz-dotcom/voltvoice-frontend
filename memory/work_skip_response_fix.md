---
name: __SKIP__ Response Audio & Chat Flow Fix
description: Fixed bot reproducing "__SKIP__" audio and pausing chat flow when AI skips responding
type: project
---

## Problem
When the bot generates `__SKIP__` as a response (meaning "nothing relevant to say"), two issues occurred:
1. The text "__SKIP__" was being read aloud instead of being silenced
2. The chat would pause for 4500ms (inactivity timeout) before continuing with the next message

## Root Cause
- The `__SKIP__` marker was being detected in `response.output_audio_transcript.delta`
- BUT the audio from Inworld was already playing/queued before the detection occurred
- The inactivity timer was waiting for RMS silence even though there was no actual audio to wait for

## Solution Implemented

### 1. Mute Audio Element Immediately (inworldRealtimeService.js:113-126)
When `_markAssistantResponseSkipAudio()` is called:
- Set `outputAudioElement.muted = true` to immediately stop playback
- Clear the audio queue to discard any buffered chunks
- Log the action for debugging

### 2. Cancel Inactivity Timer on __SKIP__ (BotInvoker.jsx:1469-1481)
In `handleTextResponse()`, when `__SKIP__` is detected:
- Cancel any running inactivity timer immediately
- Call `endAssistantResponseWindow()` to close the response window
- Call `restoreChatAudioImmediate()` to resume chat playback queue

### 3. Extra Safety in handleResponseComplete (BotInvoker.jsx:1674-1679)
Also cancel inactivity timer in this path for redundancy

### 4. Changed __SKIP__ Condition in System Instructions (BotInvoker.jsx:1161)
**Before:** "if no context útil or intervention valiosa, respond with __SKIP__" (too vague, model was conservative)
**After:** "__SKIP__ ONLY for: pure spam, flood (3+ same msg), obvious bots, or absolute silence. NO for questions, comments, or legitimate interactions. Respond to ALMOST EVERYTHING"

This prevents the model from being too conservative and skipping legitimate messages like:
- Questions ("Por q mal?")
- Short reactions
- Follow-ups to ongoing conversations

## Results
✅ No more "__SKIP__" being spoken aloud (muted immediately)
✅ Chat continues without 4500ms pause (timer cancelled)
✅ Next message processes immediately
✅ Model less likely to generate __SKIP__ in first place (clearer instructions)
