import { useState } from "react";
import { Text, View, TextInput, Button } from "react-native";
import {Checkbox} from "expo-checkbox"; 
import axios from "axios";

export default function HomeScreen() {
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState<any[]>([]); // plan is an array of { day: number, text: string }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generatePlan = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.post("http://192.168.29.137:3000/generate-plan", {
        goal: goal,
        days: 3,
      });

      setPlan(res.data.plan);
      setLoading(false);
    } catch (err) {
      setError("Failed to generate plan. Please try again.");
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Enter your goal:</Text>

      <TextInput
        placeholder="e.g. Get a job in IT"
        value={goal}
        onChangeText={setGoal}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 20,
        }}
      />

      <Button
        title={loading ? "Generating..." : "Generate Plan"}
        onPress={generatePlan}
        disabled={loading}
      />
      {loading && <Text style={{ marginTop: 20 }}>Generating plan...</Text>}
      {error && <Text style={{ marginTop: 20, color: "red" }}>{error}</Text>}
     {plan.map((item, index) => (
  <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
    
    <Checkbox
      value={item.done}
      onValueChange={() => {
        const updatedPlan = [...plan];
        updatedPlan[index].done = !updatedPlan[index].done;
        setPlan(updatedPlan);
      }}
    />

    <Text>
      Day {item.day}: {item.text}
    </Text>

  </View>
))}
    </View>
  );
}
