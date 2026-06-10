Kiro struggles to write big files, which caused a lot of failures and delays. The solution is to include the following instruction into the prompt.

```
- **IMPORTANT!!!** When writing files longer than 50 lines, always use fsWrite for the first section (up to 50 lines), then use sequential fsAppend calls for remaining sections in chunks of no more than 200 lines each — never attempt to pass the entire content of a large file in a single fsWrite call.
```

The instruction MUST be present in all agent prompts (orchestrator + step_runner). BUT ONLY FOR KIRO.