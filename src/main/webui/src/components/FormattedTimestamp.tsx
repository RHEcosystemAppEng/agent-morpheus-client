// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Timestamp } from "@patternfly/react-core";

interface FormattedTimestampProps {
  date: string | Date | null | undefined;
}


const FormattedTimestamp: React.FC<FormattedTimestampProps> = ({ date }) => {
  if (!date) {
    return <></>;
  }

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return <></>;
    }

    return (
      // Override PatternFly's default font size so the timestamp inherits the font size
      // from its parent context, ensuring it matches the surrounding text
      <Timestamp
        date={dateObj}
        customFormat={{
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }}
        is12Hour
        style={{ fontSize: "unset" }}
      />
    );
  } catch {
    return <></>;
  }
};

export default FormattedTimestamp;