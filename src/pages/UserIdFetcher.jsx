import React, { useState, useEffect } from "react";
import { User, DialectRecord } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserIdFetcher() {
  const [users, setUsers] = useState([]);
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allUsers = await User.list();
      const allRecordings = await DialectRecord.list('-created_date', 100);
      
      setUsers(allUsers);
      setRecordings(allRecordings);
      
      console.log("所有用户:", allUsers);
      console.log("所有录音:", allRecordings);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const updateRecordings = async () => {
    try {
      // 找到虚拟用户ID的录音并更新为真实用户ID
      const virtualRecordings = recordings.filter(r => 
        r.user_id.startsWith('virtual_user_')
      );
      
      console.log("需要更新的虚拟录音:", virtualRecordings);
      
      // 如果有真实用户，使用他们的ID
      if (users.length > 0) {
        for (let i = 0; i < virtualRecordings.length && i < users.length; i++) {
          const recording = virtualRecordings[i];
          const user = users[i % users.length]; // 循环使用用户
          
          await DialectRecord.update(recording.id, {
            user_id: user.id
          });
          
          console.log(`更新录音 ${recording.id} 的用户ID为 ${user.id}`);
        }
      }
    } catch (error) {
      console.error("Error updating recordings:", error);
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>用户ID获取和更新工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">现有用户 ({users.length}):</h3>
            {users.map(user => (
              <div key={user.id} className="text-sm p-2 bg-gray-100 rounded mb-1">
                ID: {user.id} | Email: {user.email}
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">虚拟用户录音 ({recordings.filter(r => r.user_id.startsWith('virtual_user_')).length}):</h3>
            {recordings.filter(r => r.user_id.startsWith('virtual_user_')).slice(0, 5).map(recording => (
              <div key={recording.id} className="text-sm p-2 bg-yellow-100 rounded mb-1">
                ID: {recording.id} | User: {recording.user_id} | Text: {recording.transcript}
              </div>
            ))}
          </div>
          
          <Button onClick={updateRecordings} className="w-full">
            更新虚拟录音为真实用户ID
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}