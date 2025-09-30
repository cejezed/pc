import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";
import { Dumbbell, Footprints, Battery, Utensils } from "lucide-react";
import { WorkoutsTab } from "./workout-componenten";
import { StappenTab } from "./stappen-componenten";
import { EnergieTab } from "./energie-componenten";
import { EtenTab } from "./eten-componenten";

export default function Health() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">🏋️ Gezondheid</h1>
      </div>

      <Tabs defaultValue="workouts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="workouts" className="flex items-center justify-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Workouts</span>
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center justify-center gap-2">
            <Footprints className="h-4 w-4" />
            <span className="hidden sm:inline">Stappen</span>
          </TabsTrigger>
          <TabsTrigger value="energy" className="flex items-center justify-center gap-2">
            <Battery className="h-4 w-4" />
            <span className="hidden sm:inline">Energie</span>
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex items-center justify-center gap-2">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Eten</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts">
          <WorkoutsTab />
        </TabsContent>
        <TabsContent value="steps">
          <StappenTab />
        </TabsContent>
        <TabsContent value="energy">
          <EnergieTab />
        </TabsContent>
        <TabsContent value="meals">
          <EtenTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
