<tr class="patient" patientid="n{{patient_id}}">
    <td>{{ patient_number }}</td>
    <td>{{ date_of_birth }}</td>
    <td>{{ location.ward_name }}</td>
    <td>{{ location.specialty }}</td>
    {% for x in ab %}
        <td title="{{loop.key}}" class="{{ section }} resistance-{{x}}">{{x}}</td>
    {% endfor %}
    <td class="tail inf"></td>
    <td class="tail ovl"></td>
    <td class="tail"><button type="button">Show Overlaps</button></td>
</tr>
