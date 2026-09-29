import { HomeView } from "@/components/home/home-view";
import {
  getContinueItems,
  getDailyGoal,
  getGreeting,
  getSectionEntries,
  getWordOfTheDay,
} from "@/lib/data/home";

export default async function HomePage() {
  const [greeting, goal, word, continueItems, sections] = await Promise.all([
    getGreeting(),
    getDailyGoal(),
    getWordOfTheDay(),
    getContinueItems(),
    getSectionEntries(),
  ]);

  return (
    <HomeView
      greeting={greeting}
      goal={goal}
      word={word}
      continueItems={continueItems}
      sections={sections}
    />
  );
}
