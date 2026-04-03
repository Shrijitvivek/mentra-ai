import { useState } from "react";
import { Text, View, TextInput, Button } from "react-native";
import axios from "axios";

export default function HomeScreen() {
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState(null);
  const generatePlan = async () => {
    try {
      const res = await axios.post("http://192.168.29.137:3000/generate-plan", {
        goal: goal,
        days: 3,
      });

      setPlan(res.data.plan);
    } catch (err) {
      console.log(err);
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

      <Button title="Generate Plan" onPress={generatePlan} />
      {plan && (
        <View style={{ marginTop: 20 }}>
          {Object.entries(plan).map(([day, text]) => (
            <Text key={day}>
              {day}: {String(text)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
