# 🦅 Niceville Polynomial Quest - Multiplayer Mode

An real-time multiplayer educational game designed for Niceville High School students to practice polynomial equations competitively.

## 🎮 How It Works

### For Teachers (Host):
1. Click **"Create Game"**
2. Enter your name
3. Share the **6-character game code** with students
4. Wait for students to join (2-4 players)
5. Click **"Start Game"** when ready
6. Advance through questions as host

### For Students (Players):
1. Click **"Join Game"**
2. Enter your name and the game code from your teacher
3. Wait in the lobby for the game to start
4. Answer questions as fast as you can!

## ⚡ Game Rules

- **3 minutes per question** - timer counts down automatically
- **1 point** for correct answers
- **2 points** (bonus!) if you answer correctly within 60 seconds
- **0 points** for incorrect answers or time running out
- Everyone sees the same question at the same time
- Live scoreboard updates in real-time
- Winner is announced at the end!

## 🎯 Features

- **20 polynomial questions** (multiple choice and short answer)
- **Real-time synchronization** - all players see questions simultaneously
- **No question repeats** - each question appears only once per game
- **Speed bonus** - rewards quick, accurate thinking
- **Live leaderboard** - see who's winning in real-time
- **Mobile-friendly** - works on phones, tablets, and computers

## 🔧 Technical Details

### Built With:
- React 18
- Firebase Firestore (real-time database)
- GitHub Pages (hosting)

### Firebase Setup:
This app requires Firebase Firestore with the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if true;
    }
  }
}
```

## 📚 Question Types

### Multiple Choice
Select all correct answers from the given choices. You must select ALL correct options to earn points.

### Short Answer
Type your answer directly. Accepts various formats:
- Fractions: `1/2` or `0.5`
- Multiple answers: Game will accept any correct form
- Imaginary numbers: `2i`, `-2i`, etc.

## 🎓 Educational Value

Students practice:
- Factoring polynomials
- Finding zeros and roots
- Solving cubic and quartic equations
- Working with complex numbers
- Applying the Rational Root Theorem
- Speed and accuracy under time pressure

## 🚀 Deployment

Automatically deployed to GitHub Pages via GitHub Actions on every push to the main branch.

**Live URL:** `https://jamie-lafollette.github.io/niceville-polynomial-quest-multiplayer/`

## 🆘 Troubleshooting

**Can't join a game?**
- Make sure the game code is correct (6 characters, case-insensitive)
- Game may have already started (can't join mid-game)
- Game may be full (max 4 players)

**Game not loading?**
- Check your internet connection
- Make sure JavaScript is enabled
- Try refreshing the page

**Timer not working?**
- All players must have synchronized clocks (uses device time)
- Refresh if timer seems stuck

## 📱 Best Practices for Classroom Use

1. **Project the game code** on a screen so everyone can see it
2. **Test with 2-3 students first** before using with full class
3. **Use teams of 2-3 students** for collaborative learning
4. **Set expectations** about time limits before starting
5. **Review answers** after each question if desired
6. **Play multiple rounds** - it's quick and engaging!

## 📞 Support

For issues or questions, contact your IT department or the app administrator.

---

**Go Eagles!** 🦅

Made with ❤️ for Niceville High School Mathematics Department
